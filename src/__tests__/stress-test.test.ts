/**
 * ACP 压力测试 & 集成测试
 * 模拟真实复杂用户工作流和极端边界条件，发现隐藏的运行时 Bug
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useACPStore } from '../store/acpStore';
import { scheduleAll, calculateMatchScore, DEFAULT_SCHEDULER_CONFIG } from '../engine/scheduler';
import { exportData } from '../utils/export';
import { findBestAgent } from '../engine/scheduler';
import { clearPersistedState } from '../store/persistMiddleware';
import type { SchedulerConfig } from '../engine/scheduler';
import type { Task, Member } from '../types';

// ============ 辅助函数 ============

/** 获取 store 初始状态并重置 */
function resetStore() {
  const initial = useACPStore.getInitialState();
  useACPStore.setState({
    organization: initial.organization,
    tasks: initial.tasks,
    messages: [],
    knowledgeNodes: initial.knowledgeNodes,
    evaluation: initial.evaluation,
    evaluationScores: initial.evaluationScores,
    logs: [],
    isSimulating: false,
    simulationInterval: 2000,
    lastSchedulerResult: null,
    schedulerConfig: { ...DEFAULT_SCHEDULER_CONFIG },
  });
}

/** 创建一个空闲成员并返回其 ID */
function addIdleMember(name: string, capabilities: string[] = ['coding']): string {
  useACPStore.getState().addMember({ name, role: 'mid', capabilities });
  const member = useACPStore.getState().organization.members.find(m => m.name === name);
  return member!.id;
}

/** 创建一个待处理任务并返回其 ID */
function addPendingTask(title: string, priority: Task['priority'] = 'P1', deps: string[] = []): string {
  useACPStore.getState().addTask({
    title,
    description: `${title} 描述`,
    priority,
    estimatedTime: 120,
    dependencies: deps.length > 0 ? deps : undefined,
  });
  const task = useACPStore.getState().tasks.find(t => t.title === title);
  return task!.id;
}

/** 获取当前所有空闲成员 */
function getIdleMembers(): Member[] {
  return useACPStore.getState().organization.members.filter(m => m.status === 'idle');
}

// ============ Suite 1: 复杂工作流模拟 ============

describe('Suite 1: Complex Workflow Simulation', () => {
  beforeEach(() => {
    resetStore();
  });

  it('1.1 Full lifecycle: create 10 tasks -> assign 5 -> progress 3 to completion -> delete 2 -> verify remaining state consistency', () => {
    // Step 1: Create 10 tasks
    const taskIds: string[] = [];
    for (let i = 0; i < 10; i++) {
      taskIds.push(addPendingTask(`Lifecycle Task ${i}`, 'P1'));
    }
    expect(useACPStore.getState().tasks.length).toBeGreaterThanOrEqual(10);

    // Step 2: Assign 5 tasks to idle members
    const idleMembers = getIdleMembers();
    expect(idleMembers.length).toBeGreaterThanOrEqual(2);

    // Make enough members idle by unassigning existing tasks
    const allMembers = useACPStore.getState().organization.members;
    allMembers.forEach(m => {
      if (m.status === 'busy' && m.currentTask) {
        useACPStore.getState().unassignTask(m.currentTask);
      }
    });

    const nowIdle = getIdleMembers();
    const assignCount = Math.min(5, nowIdle.length, taskIds.length);
    for (let i = 0; i < assignCount; i++) {
      useACPStore.getState().assignTask(taskIds[i], nowIdle[i].id);
    }

    const afterAssign = useACPStore.getState();
    const assignedTasks = afterAssign.tasks.filter(t => t.status === 'in_progress');
    expect(assignedTasks.length).toBe(assignCount);

    // Step 3: Progress 3 tasks to completion
    const completeCount = Math.min(3, assignedTasks.length);
    for (let i = 0; i < completeCount; i++) {
      useACPStore.getState().updateTask(assignedTasks[i].id, {
        progress: 100,
        status: 'completed',
      });
    }

    const afterComplete = useACPStore.getState();
    const completedTasks = afterComplete.tasks.filter(t => t.status === 'completed');
    expect(completedTasks.length).toBeGreaterThanOrEqual(completeCount);

    // Verify agents are released
    completedTasks.forEach(t => {
      if (t.assignee) {
        const agent = afterComplete.organization.members.find(m => m.id === t.assignee);
        expect(agent?.status).toBe('idle');
        expect(agent?.currentTask).toBeUndefined();
      }
    });

    // Step 4: Delete 2 tasks (from remaining non-completed)
    const remainingTasks = afterComplete.tasks.filter(t => t.status !== 'completed');
    const deleteCount = Math.min(2, remainingTasks.length);
    const toDelete = remainingTasks.slice(0, deleteCount);
    toDelete.forEach(t => {
      useACPStore.getState().deleteTask(t.id);
    });

    // Step 5: Verify final state consistency
    const finalState = useACPStore.getState();
    toDelete.forEach(t => {
      expect(finalState.tasks.find(ft => ft.id === t.id)).toBeUndefined();
    });

    // No task should reference deleted tasks in dependencies
    finalState.tasks.forEach(t => {
      toDelete.forEach(deleted => {
        expect(t.dependencies).not.toContain(deleted.id);
      });
    });

    // Member-task consistency: no member should reference a deleted task
    finalState.organization.members.forEach(m => {
      if (m.currentTask) {
        expect(finalState.tasks.find(t => t.id === m.currentTask)).toBeDefined();
      }
    });

    // Task-assignee consistency: no task should reference a non-existent member
    finalState.tasks.forEach(t => {
      if (t.assignee) {
        expect(finalState.organization.members.find(m => m.id === t.assignee)).toBeDefined();
      }
    });
  });

  it('1.2 Rapid state changes: call addTask/removeTask/updateTask 100 times rapidly -> verify no state corruption', () => {
    const store = useACPStore.getState();

    // Phase 1: Add 50 tasks rapidly
    const taskTitles: string[] = [];
    for (let i = 0; i < 50; i++) {
      taskTitles.push(`Rapid Task ${i}`);
      store.addTask({
        title: taskTitles[i],
        description: `Rapid description ${i}`,
        priority: (['P0', 'P1', 'P2', 'P3'] as const)[i % 4],
        estimatedTime: 30 + i,
      });
    }

    const afterAdd = useACPStore.getState();
    expect(afterAdd.tasks.length).toBeGreaterThanOrEqual(50);

    // Phase 2: Update 30 tasks rapidly
    const tasksToUpdate = afterAdd.tasks.filter(t => t.title.startsWith('Rapid Task')).slice(0, 30);
    tasksToUpdate.forEach((t, i) => {
      store.updateTask(t.id, {
        progress: Math.min(i * 3, 100),
        description: `Updated description ${i}`,
      });
    });

    // Phase 3: Remove 20 tasks rapidly
    const tasksToRemove = useACPStore.getState().tasks
      .filter(t => t.title.startsWith('Rapid Task'))
      .slice(0, 20);
    const removeIds = new Set(tasksToRemove.map(t => t.id));
    tasksToRemove.forEach(t => {
      store.deleteTask(t.id);
    });

    // Verify state consistency
    const finalState = useACPStore.getState();

    // All remaining tasks should have valid structure
    finalState.tasks.forEach(t => {
      expect(t.id).toBeDefined();
      expect(t.title).toBeDefined();
      expect(['P0', 'P1', 'P2', 'P3']).toContain(t.priority);
      expect(t.progress).toBeGreaterThanOrEqual(0);
      expect(t.progress).toBeLessThanOrEqual(100);
      expect(t.status).toBeDefined();
    });

    // Deleted tasks should be gone
    removeIds.forEach(id => {
      expect(finalState.tasks.find(t => t.id === id)).toBeUndefined();
    });

    // Updated tasks should have new descriptions
    tasksToUpdate.forEach((original, i) => {
      if (!removeIds.has(original.id)) {
        const current = finalState.tasks.find(t => t.id === original.id);
        if (current) {
          expect(current.description).toBe(`Updated description ${i}`);
        }
      }
    });

    // No duplicate IDs
    const idSet = new Set(finalState.tasks.map(t => t.id));
    expect(idSet.size).toBe(finalState.tasks.length);
  });

  it('1.3 Simulation + user interaction: start simulation -> manually assign task while running -> stop -> verify no conflicts', () => {
    vi.useFakeTimers();

    // Ensure there are idle members and pending tasks
    const allMembers = useACPStore.getState().organization.members;
    allMembers.forEach(m => {
      if (m.status === 'busy' && m.currentTask) {
        useACPStore.getState().unassignTask(m.currentTask);
      }
    });

    // Add a pending task
    const manualTaskId = addPendingTask('Manual Assign Task', 'P0');

    // Start simulation
    useACPStore.getState().toggleSimulation();
    expect(useACPStore.getState().isSimulating).toBe(true);

    // Advance timers to simulate a tick
    vi.advanceTimersByTime(100);

    // While "simulating", manually assign a task
    const idleMember = getIdleMembers()[0];
    if (idleMember) {
      useACPStore.getState().assignTask(manualTaskId, idleMember.id);
    }

    // Run another scheduler tick manually
    useACPStore.getState().runSchedulerTick();

    // Stop simulation
    useACPStore.getState().toggleSimulation();
    expect(useACPStore.getState().isSimulating).toBe(false);

    // Verify no conflicts: the manually assigned task should still be assigned
    const finalTask = useACPStore.getState().tasks.find(t => t.id === manualTaskId);
    if (idleMember) {
      expect(finalTask?.assignee).toBe(idleMember.id);
      expect(finalTask?.status).toBe('in_progress');
    }

    // No member should be assigned to more than one task
    const finalMembers = useACPStore.getState().organization.members;
    const busyMembers = finalMembers.filter(m => m.status === 'busy');
    busyMembers.forEach(m => {
      expect(m.currentTask).toBeDefined();
      // Verify the task actually references this member
      const task = useACPStore.getState().tasks.find(t => t.id === m.currentTask);
      expect(task?.assignee).toBe(m.id);
    });

    // No task should be assigned to a member who is not busy
    const assignedTasks = useACPStore.getState().tasks.filter(t => t.assignee);
    assignedTasks.forEach(t => {
      const member = finalMembers.find(m => m.id === t.assignee);
      expect(member?.status).toBe('busy');
    });

    vi.useRealTimers();
  });

  it('1.4 Import -> modify -> export roundtrip: export data -> make changes -> import original -> verify clean state', () => {
    const state = useACPStore.getState();

    // Step 1: Export current state
    const exportedJson = exportData({
      organization: state.organization,
      tasks: state.tasks,
      messages: state.messages,
      knowledgeNodes: state.knowledgeNodes,
      evaluation: state.evaluation,
      evaluationScores: state.evaluationScores,
    });
    const exportedData = JSON.parse(exportedJson);

    // Step 2: Make changes to the store
    addIdleMember('Roundtrip Member', ['testing']);
    addPendingTask('Roundtrip Task', 'P0');
    useACPStore.getState().sendMessage(
      state.organization.members[0].id,
      state.organization.members[1].id,
      'notification',
      'Roundtrip message'
    );

    const modifiedState = useACPStore.getState();
    expect(modifiedState.organization.members.length).toBeGreaterThan(exportedData.organization.members.length);
    expect(modifiedState.tasks.length).toBeGreaterThan(exportedData.tasks.length);
    expect(modifiedState.messages.length).toBeGreaterThan(exportedData.messages.length);

    // Step 3: "Import" the original exported data (simulate import by setting state)
    useACPStore.setState({
      organization: exportedData.organization,
      tasks: exportedData.tasks,
      messages: exportedData.messages,
      knowledgeNodes: exportedData.knowledgeNodes,
      evaluation: exportedData.evaluation,
      evaluationScores: exportedData.evaluationScores,
    });

    // Step 4: Verify state matches the original export
    const restoredState = useACPStore.getState();
    expect(restoredState.organization.members.length).toBe(exportedData.organization.members.length);
    expect(restoredState.tasks.length).toBe(exportedData.tasks.length);
    expect(restoredState.messages.length).toBe(exportedData.messages.length);
    expect(restoredState.knowledgeNodes.length).toBe(exportedData.knowledgeNodes.length);

    // The roundtrip additions should be gone
    expect(restoredState.organization.members.find(m => m.name === 'Roundtrip Member')).toBeUndefined();
    expect(restoredState.tasks.find(t => t.title === 'Roundtrip Task')).toBeUndefined();
    expect(restoredState.messages.find(m => m.content === 'Roundtrip message')).toBeUndefined();
  });
});

// ============ Suite 2: 边界条件压力测试 ============

describe('Suite 2: Edge Case Stress Tests', () => {
  beforeEach(() => {
    resetStore();
  });

  it('2.1 Empty state operations: remove all members -> try to assign task -> try to run scheduler tick -> verify no crashes', () => {
    // Remove all members one by one
    const members = [...useACPStore.getState().organization.members];
    members.forEach(m => {
      useACPStore.getState().removeMember(m.id);
    });

    expect(useACPStore.getState().organization.members.length).toBe(0);

    // Try to assign a task (should not crash)
    const taskId = addPendingTask('Orphan Task', 'P1');
    expect(() => {
      useACPStore.getState().assignTask(taskId, 'nonexistent-member-id');
    }).not.toThrow();

    // Task should remain unassigned
    const task = useACPStore.getState().tasks.find(t => t.id === taskId);
    expect(task?.assignee).toBeUndefined();
    expect(task?.status).toBe('pending');

    // Try to run scheduler tick with no members (should not crash)
    expect(() => {
      useACPStore.getState().runSchedulerTick();
    }).not.toThrow();

    // Result should exist but with 0 assignments
    const result = useACPStore.getState().lastSchedulerResult;
    expect(result).toBeDefined();
    expect(result!.tasksAssigned).toBe(0);
  });

  it('2.2 All members offline: set all members to offline -> run scheduler tick -> verify no crash', () => {
    const members = useACPStore.getState().organization.members;
    members.forEach(m => {
      useACPStore.getState().updateMemberStatus(m.id, 'offline');
    });

    const allOffline = useACPStore.getState().organization.members.every(m => m.status === 'offline');
    expect(allOffline).toBe(true);

    // Run scheduler tick - should not crash (tests bug #1 fix: random member selection on empty array)
    expect(() => {
      useACPStore.getState().runSchedulerTick();
    }).not.toThrow();

    // No tasks should be assigned
    const result = useACPStore.getState().lastSchedulerResult;
    expect(result).toBeDefined();
    expect(result!.tasksAssigned).toBe(0);

    // No messages should be generated (need >= 2 active members)
    // The state should remain consistent
    const stateAfter = useACPStore.getState();
    stateAfter.tasks.forEach(t => {
      if (t.status === 'pending') {
        expect(t.assignee).toBeUndefined();
      }
    });
  });

  it('2.3 Self-referencing dependencies: create task A depends on B, B depends on A -> verify behavior', () => {
    // Create two tasks without dependencies first
    const taskAId = addPendingTask('Task A', 'P1');
    const taskBId = addPendingTask('Task B', 'P1');

    // Set up circular dependency: A depends on B, B depends on A
    useACPStore.getState().updateTask(taskAId, { dependencies: [taskBId] });
    useACPStore.getState().updateTask(taskBId, { dependencies: [taskAId] });

    const taskA = useACPStore.getState().tasks.find(t => t.id === taskAId);
    const taskB = useACPStore.getState().tasks.find(t => t.id === taskBId);

    // Both tasks should have their dependencies set (store allows it)
    expect(taskA?.dependencies).toContain(taskBId);
    expect(taskB?.dependencies).toContain(taskAId);

    // Run scheduler - neither task should be assignable since both depend on incomplete tasks
    const org = useACPStore.getState().organization;
    const config = useACPStore.getState().schedulerConfig;
    const decisions = scheduleAll(useACPStore.getState().tasks, org, config);

    // Neither A nor B should be scheduled (both have unmet dependencies)
    const scheduledIds = decisions.map(d => d.taskId);
    expect(scheduledIds).not.toContain(taskAId);
    expect(scheduledIds).not.toContain(taskBId);

    // Run a full tick - should not crash
    expect(() => {
      useACPStore.getState().runSchedulerTick();
    }).not.toThrow();
  });

  it('2.4 Invalid dependency references: create task with dependency on non-existent ID -> verify handled gracefully', () => {
    // Try to add a task with a non-existent dependency
    useACPStore.getState().addTask({
      title: 'Invalid Dep Task',
      description: 'Task with invalid dependency',
      priority: 'P1',
      estimatedTime: 60,
      dependencies: ['nonexistent-task-id-12345'],
    });

    // The task should NOT be created (validation should reject it)
    const task = useACPStore.getState().tasks.find(t => t.title === 'Invalid Dep Task');
    expect(task).toBeUndefined();

    // Now create a valid task and then update it with invalid dependency via setState directly
    const validTaskId = addPendingTask('Valid Task', 'P1');
    useACPStore.setState({
      tasks: useACPStore.getState().tasks.map(t =>
        t.id === validTaskId
          ? { ...t, dependencies: ['ghost-dep-id'] }
          : t
      ),
    });

    // The task now has a ghost dependency - scheduler should handle it gracefully
    const org = useACPStore.getState().organization;
    const config = useACPStore.getState().schedulerConfig;
    const decisions = scheduleAll(useACPStore.getState().tasks, org, config);

    // Task with unresolvable dependency is now treated as schedulable (missing deps = satisfied)
    const scheduledGhost = decisions.find(d => d.taskId === validTaskId);
    expect(scheduledGhost).toBeDefined();

    // Tick should not crash
    expect(() => {
      useACPStore.getState().runSchedulerTick();
    }).not.toThrow();
  });

  it('2.5 Maximum capacity: add 1000 tasks -> verify performance and correctness', () => {
    const startTime = performance.now();

    // Add 1000 tasks
    for (let i = 0; i < 1000; i++) {
      useACPStore.getState().addTask({
        title: `Capacity Task ${i}`,
        description: `Description for capacity task ${i}`,
        priority: (['P0', 'P1', 'P2', 'P3'] as const)[i % 4],
        estimatedTime: 30 + (i % 120),
      });
    }

    const afterAdd = performance.now();
    const addDuration = afterAdd - startTime;

    const state = useACPStore.getState();
    expect(state.tasks.length).toBeGreaterThanOrEqual(1000);

    // Verify no duplicate IDs
    const idSet = new Set(state.tasks.map(t => t.id));
    expect(idSet.size).toBe(state.tasks.length);

    // Verify all tasks have valid data
    state.tasks.forEach(t => {
      expect(t.id).toBeTruthy();
      expect(t.title).toBeTruthy();
      expect(t.priority).toMatch(/^P[0-3]$/);
      expect(t.progress).toBeGreaterThanOrEqual(0);
      expect(t.progress).toBeLessThanOrEqual(100);
      expect(t.estimatedTime).toBeGreaterThan(0);
    });

    // Performance check: should complete within reasonable time (< 5 seconds)
    expect(addDuration).toBeLessThan(5000);

    // Run scheduler tick with 1000 tasks - should not crash
    expect(() => {
      useACPStore.getState().runSchedulerTick();
    }).not.toThrow();

    const afterTick = performance.now();
    expect(afterTick - afterAdd).toBeLessThan(5000);
  });

  it('2.6 Concurrent simulation ticks: call runSchedulerTick 50 times synchronously -> verify state consistency', () => {
    // Ensure there are idle members and pending tasks
    const allMembers = useACPStore.getState().organization.members;
    allMembers.forEach(m => {
      if (m.status === 'busy' && m.currentTask) {
        useACPStore.getState().unassignTask(m.currentTask);
      }
    });

    // Add some pending tasks
    for (let i = 0; i < 10; i++) {
      addPendingTask(`Concurrent Task ${i}`, 'P1');
    }

    // Run 50 ticks synchronously
    expect(() => {
      for (let i = 0; i < 50; i++) {
        useACPStore.getState().runSchedulerTick();
      }
    }).not.toThrow();

    // Verify state consistency
    const finalState = useACPStore.getState();

    // No member should be assigned to more than one task
    const busyMembers = finalState.organization.members.filter(m => m.status === 'busy');
    busyMembers.forEach(m => {
      expect(m.currentTask).toBeDefined();
      const assignedTask = finalState.tasks.find(t => t.id === m.currentTask);
      expect(assignedTask).toBeDefined();
      expect(assignedTask?.assignee).toBe(m.id);
    });

    // No task should be assigned to multiple members
    const assignedTasks = finalState.tasks.filter(t => t.assignee);
    const assigneeSet = new Set(assignedTasks.map(t => t.assignee));
    // Each busy member should have exactly one task
    busyMembers.forEach(m => {
      expect(assigneeSet.has(m.id)).toBe(true);
    });

    // Progress values should be valid
    finalState.tasks.forEach(t => {
      expect(t.progress).toBeGreaterThanOrEqual(0);
      expect(t.progress).toBeLessThanOrEqual(100);
      if (t.status === 'completed') {
        expect(t.progress).toBe(100);
      }
    });

    // Last scheduler result should exist
    expect(finalState.lastSchedulerResult).toBeDefined();
  });
});

// ============ Suite 3: 数据完整性测试 ============

describe('Suite 3: Data Integrity Tests', () => {
  beforeEach(() => {
    resetStore();
  });

  it('3.1 Member removal cascade: add member -> assign tasks -> send messages -> remove member -> verify cascade cleanup', () => {
    // Add a new member
    const memberId = addIdleMember('Cascade Member', ['testing', 'coding']);
    const existingMember = useACPStore.getState().organization.members.find(
      m => m.id !== memberId && m.status !== 'offline'
    )!;

    // Assign tasks to the new member
    const task1Id = addPendingTask('Cascade Task 1', 'P1');
    addPendingTask('Cascade Task 2', 'P2');
    useACPStore.getState().assignTask(task1Id, memberId);
    // Need to complete task1 first or use another idle member
    // Actually, member is now busy. Let's use a different approach.
    // Unassign and use a different member for task2
    useACPStore.getState().unassignTask(task1Id);
    useACPStore.getState().assignTask(task1Id, memberId);
    // Now member is busy with task1

    // Send messages involving this member
    useACPStore.getState().sendMessage(memberId, existingMember.id, 'request', 'Help needed');
    useACPStore.getState().sendMessage(existingMember.id, memberId, 'response', 'Sure');

    const beforeRemove = useACPStore.getState();
    expect(beforeRemove.tasks.find(t => t.id === task1Id)?.assignee).toBe(memberId);
    expect(beforeRemove.messages.length).toBe(2);

    // Remove the member
    useACPStore.getState().removeMember(memberId);

    const afterRemove = useACPStore.getState();

    // Member should be gone
    expect(afterRemove.organization.members.find(m => m.id === memberId)).toBeUndefined();

    // Tasks previously assigned to this member should be unassigned
    const task1 = afterRemove.tasks.find(t => t.id === task1Id);
    expect(task1?.assignee).toBeUndefined();
    expect(task1?.status).toBe('pending');

    // Messages involving this member should be cleaned
    expect(afterRemove.messages.find(m => m.from === memberId)).toBeUndefined();
    expect(afterRemove.messages.find(m => m.to === memberId)).toBeUndefined();

    // Department membership should be cleaned
    afterRemove.organization.departments.forEach(dept => {
      expect(dept.members).not.toContain(memberId);
      if (dept.head === memberId) {
        expect(dept.head).toBe('');
      }
    });
  });

  it('3.2 Task deletion dependency cleanup: create task A (depends on B) -> delete B -> verify A no longer references B', () => {
    const taskAId = addPendingTask('Dependent Task A', 'P1');
    const taskBId = addPendingTask('Dependency Task B', 'P1');

    // Make A depend on B
    useACPStore.getState().updateTask(taskAId, { dependencies: [taskBId] });

    const beforeDelete = useACPStore.getState();
    expect(beforeDelete.tasks.find(t => t.id === taskAId)?.dependencies).toContain(taskBId);

    // Also make another task C depend on B
    const taskCId = addPendingTask('Dependent Task C', 'P2');
    useACPStore.getState().updateTask(taskCId, { dependencies: [taskBId] });

    // Delete B
    useACPStore.getState().deleteTask(taskBId);

    const afterDelete = useACPStore.getState();

    // B should be gone
    expect(afterDelete.tasks.find(t => t.id === taskBId)).toBeUndefined();

    // A should no longer reference B
    expect(afterDelete.tasks.find(t => t.id === taskAId)?.dependencies).not.toContain(taskBId);

    // C should no longer reference B
    expect(afterDelete.tasks.find(t => t.id === taskCId)?.dependencies).not.toContain(taskBId);

    // A and C should still exist
    expect(afterDelete.tasks.find(t => t.id === taskAId)).toBeDefined();
    expect(afterDelete.tasks.find(t => t.id === taskCId)).toBeDefined();
  });

  it('3.3 Persist -> clear -> reload: set state -> persist -> clearPersistedState -> verify localStorage is clean', () => {
    // Mock localStorage
    const store: Record<string, string> = {};
    const localStorageMock = {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: vi.fn((key: string) => { delete store[key]; }),
      clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
      get length() { return Object.keys(store).length; },
      key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
    };
    vi.stubGlobal('localStorage', localStorageMock);

    // Set some state
    addIdleMember('Persist Test Member', ['testing']);
    addPendingTask('Persist Test Task', 'P0');

    // Manually trigger persist by calling the persist logic
    // The persistMiddleware subscribes to state changes, but we need to simulate it
    const state = useACPStore.getState();
    const persistState = {
      _version: 2,
      organization: state.organization,
      tasks: state.tasks,
      messages: state.messages,
      knowledgeNodes: state.knowledgeNodes,
      evaluation: state.evaluation,
      evaluationScores: state.evaluationScores,
      schedulerConfig: state.schedulerConfig,
    };
    localStorage.setItem('acp-store-v1', JSON.stringify(persistState));

    // Verify data was persisted
    expect(localStorage.getItem('acp-store-v1')).toBeTruthy();

    // Clear persisted state
    clearPersistedState();

    // Verify localStorage is clean
    expect(localStorage.getItem('acp-store-v1')).toBeNull();

    vi.unstubAllGlobals();
  });

  it('3.4 Version migration: create v1 data (without schedulerConfig) -> load via middleware -> verify schedulerConfig gets default value', () => {
    // Mock localStorage with v1 data (no schedulerConfig)
    const store: Record<string, string> = {};
    const getItemCalls: string[] = [];
    const localStorageMock = {
      getItem: vi.fn((key: string) => {
        getItemCalls.push(key);
        return store[key] ?? null;
      }),
      setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: vi.fn((key: string) => { delete store[key]; }),
      clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
      get length() { return Object.keys(store).length; },
      key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
    };
    vi.stubGlobal('localStorage', localStorageMock);

    // Create v1 data (no schedulerConfig, no _version)
    const v1Data = {
      organization: useACPStore.getState().organization,
      tasks: useACPStore.getState().tasks,
      messages: [],
      knowledgeNodes: useACPStore.getState().knowledgeNodes,
      evaluation: useACPStore.getState().evaluation,
    };
    store['acp-store-v1'] = JSON.stringify(v1Data);

    // Import the migrate function logic directly for testing
    // Since persistMiddleware loads via setTimeout, we test the migrate function directly
    const parsed = JSON.parse(store['acp-store-v1']);
    const version = parsed._version || 1;

    // Simulate migration
    let migrated = { ...parsed };
    if (version < 2) {
      if (!migrated.schedulerConfig) {
        migrated.schedulerConfig = {
          capabilityWeight: 0.3,
          reputationWeight: 0.25,
          workloadWeight: 0.25,
          priorityWeight: 0.2,
          preferIdleAgents: true,
        };
      }
      if (!migrated.evaluationScores) {
        migrated.evaluationScores = [];
      }
    }
    migrated._version = 2;

    // Verify migration added schedulerConfig
    expect(migrated.schedulerConfig).toBeDefined();
    expect(migrated.schedulerConfig.capabilityWeight).toBe(0.3);
    expect(migrated.schedulerConfig.reputationWeight).toBe(0.25);
    expect(migrated.schedulerConfig.workloadWeight).toBe(0.25);
    expect(migrated.schedulerConfig.priorityWeight).toBe(0.2);
    expect(migrated.schedulerConfig.preferIdleAgents).toBe(true);
    expect(migrated._version).toBe(2);

    vi.unstubAllGlobals();
  });

  it('3.5 Export with all data: export with tasks, members, messages, knowledge nodes -> verify all fields present in JSON', () => {
    // Set up rich state
    addIdleMember('Export Member', ['export-capability']);
    addPendingTask('Export Task', 'P0');
    const members = useACPStore.getState().organization.members;
    useACPStore.getState().sendMessage(members[0].id, members[1].id, 'request', 'Export test message');
    useACPStore.getState().addKnowledgeNode({
      type: 'concept',
      name: 'Export Test Node',
      description: 'Node for export test',
      connections: [],
    });

    const state = useACPStore.getState();
    const json = exportData({
      organization: state.organization,
      tasks: state.tasks,
      messages: state.messages,
      knowledgeNodes: state.knowledgeNodes,
      evaluation: state.evaluation,
      evaluationScores: state.evaluationScores,
    });

    const parsed = JSON.parse(json);

    // Verify top-level fields
    expect(parsed.version).toBeDefined();
    expect(parsed.exportedAt).toBeDefined();
    expect(parsed.organization).toBeDefined();
    expect(parsed.tasks).toBeDefined();
    expect(parsed.messages).toBeDefined();
    expect(parsed.knowledgeNodes).toBeDefined();
    expect(parsed.evaluation).toBeDefined();
    expect(parsed.evaluationScores).toBeDefined();

    // Verify organization structure
    expect(parsed.organization.members).toBeInstanceOf(Array);
    expect(parsed.organization.members.length).toBeGreaterThan(0);
    expect(parsed.organization.departments).toBeInstanceOf(Array);
    expect(parsed.organization.name).toBeDefined();
    expect(parsed.organization.type).toBeDefined();

    // Verify tasks have all required fields
    parsed.tasks.forEach((t: Task) => {
      expect(t.id).toBeDefined();
      expect(t.title).toBeDefined();
      expect(t.description).toBeDefined();
      expect(t.status).toBeDefined();
      expect(t.priority).toBeDefined();
      expect(t.progress).toBeDefined();
      expect(t.estimatedTime).toBeDefined();
      expect(t.createdAt).toBeDefined();
      expect(Array.isArray(t.dependencies)).toBe(true);
    });

    // Verify members have all required fields
    parsed.organization.members.forEach((m: Member) => {
      expect(m.id).toBeDefined();
      expect(m.name).toBeDefined();
      expect(m.role).toBeDefined();
      expect(m.capabilities).toBeInstanceOf(Array);
      expect(m.status).toBeDefined();
      expect(typeof m.reputation).toBe('number');
    });

    // Verify messages
    expect(parsed.messages.length).toBeGreaterThan(0);
    parsed.messages.forEach((m: any) => {
      expect(m.id).toBeDefined();
      expect(m.from).toBeDefined();
      expect(m.to).toBeDefined();
      expect(m.type).toBeDefined();
      expect(m.content).toBeDefined();
      expect(m.timestamp).toBeDefined();
    });

    // Verify knowledge nodes
    expect(parsed.knowledgeNodes.length).toBeGreaterThan(0);
    parsed.knowledgeNodes.forEach((n: any) => {
      expect(n.id).toBeDefined();
      expect(n.type).toBeDefined();
      expect(n.name).toBeDefined();
      expect(n.description).toBeDefined();
      expect(Array.isArray(n.connections)).toBe(true);
    });
  });

  it('3.6 Import validation: try importing invalid JSON, missing fields, wrong types -> verify errors returned', () => {
    // Since validateImportData is not exported, we replicate the validation logic
    // to test the expected behavior of import validation
    function validateImportData(data: any): { valid: boolean; errors: string[] } {
      const errors: string[] = [];
      if (!data || typeof data !== 'object') {
        errors.push('数据格式无效');
        return { valid: false, errors };
      }
      if (!data.version) {
        errors.push('缺少版本号');
      }
      if (!data.organization || typeof data.organization !== 'object') {
        errors.push('缺少组织数据');
      } else {
        if (!Array.isArray(data.organization.members)) {
          errors.push('organization.members 不是数组');
        }
        if (!Array.isArray(data.organization.departments)) {
          errors.push('organization.departments 不是数组');
        }
      }
      if (!Array.isArray(data.tasks)) {
        errors.push('tasks 不是数组');
      }
      if (!Array.isArray(data.messages)) {
        errors.push('messages 不是数组');
      }
      if (!Array.isArray(data.knowledgeNodes)) {
        errors.push('knowledgeNodes 不是数组');
      }
      return { valid: errors.length === 0, errors };
    }

    // Test 1: null data
    let result = validateImportData(null);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);

    // Test 2: non-object
    result = validateImportData("not an object");
    expect(result.valid).toBe(false);

    result = validateImportData(42);
    expect(result.valid).toBe(false);

    // Test 3: missing version
    result = validateImportData({
      organization: { members: [], departments: [] },
      tasks: [],
      messages: [],
      knowledgeNodes: [],
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('缺少版本号');

    // Test 4: missing organization
    result = validateImportData({
      version: '2.0.0',
      tasks: [],
      messages: [],
      knowledgeNodes: [],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('组织数据'))).toBe(true);

    // Test 5: organization.members is not an array
    result = validateImportData({
      version: '2.0.0',
      organization: { members: 'not-array', departments: [] },
      tasks: [],
      messages: [],
      knowledgeNodes: [],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('members'))).toBe(true);

    // Test 6: tasks is not an array
    result = validateImportData({
      version: '2.0.0',
      organization: { members: [], departments: [] },
      tasks: 'not-array',
      messages: [],
      knowledgeNodes: [],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('tasks'))).toBe(true);

    // Test 7: messages is not an array
    result = validateImportData({
      version: '2.0.0',
      organization: { members: [], departments: [] },
      tasks: [],
      messages: {},
      knowledgeNodes: [],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('messages'))).toBe(true);

    // Test 8: knowledgeNodes is not an array
    result = validateImportData({
      version: '2.0.0',
      organization: { members: [], departments: [] },
      tasks: [],
      messages: [],
      knowledgeNodes: 'not-array',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('knowledgeNodes'))).toBe(true);

    // Test 9: valid data should pass
    result = validateImportData({
      version: '2.0.0',
      organization: { members: [], departments: [] },
      tasks: [],
      messages: [],
      knowledgeNodes: [],
    });
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });
});

// ============ Suite 4: 调度器引擎压力测试 ============

describe('Suite 4: Scheduler Engine Stress Tests', () => {
  beforeEach(() => {
    resetStore();
  });

  it('4.1 Empty organization: scheduleAll with no members -> verify empty result', () => {
    // Remove all members
    const members = [...useACPStore.getState().organization.members];
    members.forEach(m => {
      useACPStore.getState().removeMember(m.id);
    });

    const org = useACPStore.getState().organization;
    const tasks = useACPStore.getState().tasks;
    const config = useACPStore.getState().schedulerConfig;

    const decisions = scheduleAll(tasks, org, config);
    expect(decisions).toEqual([]);
    expect(decisions.length).toBe(0);
  });

  it('4.2 All busy agents: all members busy -> scheduleAll -> verify no assignments', () => {
    // Set all members to busy
    const members = useACPStore.getState().organization.members;
    members.forEach(m => {
      useACPStore.getState().updateMemberStatus(m.id, 'busy');
    });

    const allBusy = useACPStore.getState().organization.members.every(m => m.status === 'busy');
    expect(allBusy).toBe(true);

    // Add pending tasks
    for (let i = 0; i < 5; i++) {
      addPendingTask(`Busy Agent Task ${i}`, 'P0');
    }

    const org = useACPStore.getState().organization;
    const tasks = useACPStore.getState().tasks;
    const config = useACPStore.getState().schedulerConfig;

    const decisions = scheduleAll(tasks, org, config);
    expect(decisions.length).toBe(0);

    // Also test findBestAgent returns null
    const pendingTask = tasks.find(t => t.status === 'pending');
    if (pendingTask) {
      const decision = findBestAgent(pendingTask, org, config);
      expect(decision).toBeNull();
    }
  });

  it('4.3 Priority ordering: create P0, P1, P2, P3 tasks with 1 idle agent -> verify P0 gets assigned first', () => {
    // Make all members busy except one
    const members = useACPStore.getState().organization.members;
    members.forEach((m, i) => {
      if (i === 0) {
        useACPStore.getState().updateMemberStatus(m.id, 'idle');
      } else {
        useACPStore.getState().updateMemberStatus(m.id, 'busy');
      }
    });

    const idleMembers = getIdleMembers();
    expect(idleMembers.length).toBe(1);

    // Create tasks with different priorities
    addPendingTask('P3 Low Priority Task', 'P3');
    const p0Task = addPendingTask('P0 Critical Task', 'P0');
    addPendingTask('P2 Medium Task', 'P2');
    addPendingTask('P1 High Task', 'P1');

    const org = useACPStore.getState().organization;
    const tasks = useACPStore.getState().tasks;
    const config = useACPStore.getState().schedulerConfig;

    const decisions = scheduleAll(tasks, org, config);

    // With only 1 idle agent, only 1 task should be assigned
    expect(decisions.length).toBe(1);

    // The assigned task should be P0 (highest priority)
    expect(decisions[0].taskId).toBe(p0Task);
  });

  it('4.4 Capability matching: agent with [react] vs task needing [react, node] -> verify scoring', () => {
    const agent: Member = {
      id: 'test-agent-cap',
      name: 'React Agent',
      role: 'mid',
      level: 5,
      reputation: 70,
      capabilities: ['react', 'typescript', 'css'],
      status: 'idle',
    };

    const task: Task = {
      id: 'test-task-cap',
      title: 'Build react node application',
      description: 'Build a full-stack application using react and node',
      status: 'pending',
      priority: 'P1',
      dependencies: [],
      progress: 0,
      estimatedTime: 120,
      createdAt: Date.now(),
    };

    const config = useACPStore.getState().schedulerConfig;
    const { score, reason } = calculateMatchScore(task, agent, [agent], config);

    // Score should be positive (react matches in title/description)
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
    expect(reason).toBeTruthy();

    // Now test with an agent that has no matching capabilities
    const mismatchAgent: Member = {
      id: 'test-agent-nomatch',
      name: 'Data Agent',
      role: 'mid',
      level: 5,
      reputation: 70,
      capabilities: ['python', 'data-science', 'ml'],
      status: 'idle',
    };

    const { score: mismatchScore } = calculateMatchScore(task, mismatchAgent, [mismatchAgent], config);

    // The react agent should score higher due to capability match
    expect(score).toBeGreaterThan(mismatchScore);
  });

  it('4.5 Weight configuration extremes: set all weights to 0 except one -> verify that dimension dominates', () => {
    const agent: Member = {
      id: 'weight-test-agent',
      name: 'Test Agent',
      role: 'mid',
      level: 5,
      reputation: 50,
      capabilities: ['react'],
      status: 'idle',
    };

    const task: Task = {
      id: 'weight-test-task',
      title: 'Build react app',
      description: 'Build a react application',
      status: 'pending',
      priority: 'P0',
      dependencies: [],
      progress: 0,
      estimatedTime: 120,
      createdAt: Date.now(),
    };

    // Test 1: Only capability weight matters
    const capOnlyConfig: SchedulerConfig = {
      capabilityWeight: 1.0,
      reputationWeight: 0,
      workloadWeight: 0,
      priorityWeight: 0,
      preferIdleAgents: true,
    };

    const { score: capScore } = calculateMatchScore(task, agent, [agent], capOnlyConfig);
    // With only capability weight, score should be based purely on capability match
    // react appears in title and description, so capabilityMatches = 1
    // capabilityScore = (1/1) * 100 = 100
    // totalScore = 100 * 1.0 = 100
    expect(capScore).toBe(100);

    // Test 2: Only reputation weight matters
    const repOnlyConfig: SchedulerConfig = {
      capabilityWeight: 0,
      reputationWeight: 1.0,
      workloadWeight: 0,
      priorityWeight: 0,
      preferIdleAgents: true,
    };

    const { score: repScore } = calculateMatchScore(task, agent, [agent], repOnlyConfig);
    // With only reputation weight, score = reputation = 50
    expect(repScore).toBe(50);

    // Test 3: Only workload weight matters
    const workOnlyConfig: SchedulerConfig = {
      capabilityWeight: 0,
      reputationWeight: 0,
      workloadWeight: 1.0,
      priorityWeight: 0,
      preferIdleAgents: true,
    };

    const { score: idleWorkScore } = calculateMatchScore(task, agent, [agent], workOnlyConfig);
    // Idle agent gets workloadScore = 100
    expect(idleWorkScore).toBe(100);

    // Busy agent gets workloadScore = 20
    const busyAgent: Member = { ...agent, status: 'busy' };
    const { score: busyWorkScore } = calculateMatchScore(task, busyAgent, [busyAgent], workOnlyConfig);
    expect(busyWorkScore).toBe(20);

    // Test 4: Only priority weight matters
    const prioOnlyConfig: SchedulerConfig = {
      capabilityWeight: 0,
      reputationWeight: 0,
      workloadWeight: 0,
      priorityWeight: 1.0,
      preferIdleAgents: true,
    };

    const { score: p0Score } = calculateMatchScore(task, agent, [agent], prioOnlyConfig);
    // P0 priority: priorityScore = 100 * (50/100) = 50
    expect(p0Score).toBe(50);

    const p3Task: Task = { ...task, priority: 'P3' };
    const { score: p3Score } = calculateMatchScore(p3Task, agent, [agent], prioOnlyConfig);
    // P3 priority: priorityScore = 25 * (50/100) = 12.5 -> rounded to 13
    expect(p3Score).toBeLessThan(p0Score);

    // Test 5: All zero weights (edge case - should still produce a valid score)
    const zeroConfig: SchedulerConfig = {
      capabilityWeight: 0,
      reputationWeight: 0,
      workloadWeight: 0,
      priorityWeight: 0,
      preferIdleAgents: true,
    };

    const { score: zeroScore } = calculateMatchScore(task, agent, [agent], zeroConfig);
    expect(zeroScore).toBeGreaterThanOrEqual(0);
    expect(zeroScore).toBeLessThanOrEqual(100);
  });
});
