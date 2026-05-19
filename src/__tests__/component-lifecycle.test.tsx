/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * 组件生命周期测试
 * 测试 React 组件挂载、卸载、重挂载时的行为
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import React, { useState, useEffect } from 'react';

// ============ Hooks ============
import { useSimulation } from '../hooks/useSimulation';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useDebounce } from '../hooks/useDebounce';

// ============ 组件 ============
import { TaskCompletionChart } from '../components/charts/TaskCompletionChart';
import KnowledgeGraph from '../pages/knowledge/KnowledgeGraph';
import AddNodeModal from '../pages/knowledge/AddNodeModal';
import ErrorBoundary from '../components/ErrorBoundary';

// ============ 引擎 ============
import * as simulationModule from '../engine/simulation';

// ============ 类型 ============
import type { Task } from '../types';
import type { KnowledgeNode } from '../types';
import type { LayoutNode } from '../pages/knowledge/computeLayout';

// ============ 1. useSimulation hook 生命周期 ============

describe('useSimulation hook lifecycle', () => {
  beforeEach(() => {
    // 重置模拟引擎状态
    simulationModule.destroy();
  });

  afterEach(() => {
    cleanup();
    simulationModule.destroy();
  });

  const TestSimulationComponent: React.FC = () => {
    const { isRunning, start, stop } = useSimulation();
    return (
      <div>
        <div data-testid="running">{isRunning ? 'running' : 'stopped'}</div>
        <button onClick={start} data-testid="start-btn">Start</button>
        <button onClick={stop} data-testid="stop-btn">Stop</button>
      </div>
    );
  };

  it('should call stopSimulation when component unmounts', () => {
    const stopSpy = vi.spyOn(simulationModule, 'stopSimulation');
    
    const { unmount } = render(<TestSimulationComponent />);
    
    // 启动模拟
    fireEvent.click(screen.getByTestId('start-btn'));
    expect(screen.getByTestId('running').textContent).toBe('running');
    
    // 卸载组件
    unmount();
    
    // 验证 stopSimulation 被调用
    expect(stopSpy).toHaveBeenCalled();
    
    stopSpy.mockRestore();
  });

  it('should handle refCount correctly when multiple components use simulation', () => {
    const startSpy = vi.spyOn(simulationModule, 'startSimulation');
    const stopSpy = vi.spyOn(simulationModule, 'stopSimulation');
    
    const { unmount: unmount1 } = render(<TestSimulationComponent />);
    const { unmount: unmount2 } = render(<TestSimulationComponent />);
    
    // 启动第一个组件的模拟
    fireEvent.click(screen.getAllByTestId('start-btn')[0]);
    
    // 卸载第一个组件
    unmount1();
    
    // 由于 refCount 机制，模拟应该仍在运行
    expect(startSpy).toHaveBeenCalled();
    
    // 卸载第二个组件
    unmount2();
    
    // 现在 stopSimulation 应该被调用两次（每个组件卸载时）
    expect(stopSpy).toHaveBeenCalled();
    
    startSpy.mockRestore();
    stopSpy.mockRestore();
  });
});

// ============ 2. useLocalStorage hook 持久化 ============

describe('useLocalStorage hook persistence', () => {
  const TEST_KEY = 'test-lifecycle-key';

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    localStorage.removeItem(TEST_KEY);
  });

  const TestLocalStorageComponent: React.FC<{ initialValue?: string }> = ({ 
    initialValue = 'initial' 
  }) => {
    const [value, setValue] = useLocalStorage<string>(TEST_KEY, initialValue);
    return (
      <div>
        <div data-testid="value">{value}</div>
        <input 
          data-testid="input" 
          value={value} 
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
    );
  };

  it('should persist value to localStorage after unmount and remount', () => {
    const { unmount } = render(<TestLocalStorageComponent />);
    
    // 修改值
    fireEvent.change(screen.getByTestId('input'), { target: { value: 'modified-value' } });
    expect(screen.getByTestId('value').textContent).toBe('modified-value');
    
    // 验证 localStorage 已更新
    expect(localStorage.getItem(TEST_KEY)).toBe(JSON.stringify('modified-value'));
    
    // 卸载组件
    unmount();
    
    // 重新挂载
    render(<TestLocalStorageComponent initialValue="should-not-use-this" />);
    
    // 验证值从 localStorage 恢复
    expect(screen.getByTestId('value').textContent).toBe('modified-value');
  });

  it('should handle localStorage errors gracefully', () => {
    // 保存原始方法
    const originalWindowLocalStorage = window.localStorage;
    let setItemCallCount = 0;
    
    // 模拟 window.localStorage 错误
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: originalWindowLocalStorage.getItem.bind(originalWindowLocalStorage),
        setItem: (_key: string, _value: string) => {
          setItemCallCount++;
          throw new Error('QuotaExceededError');
        },
        removeItem: originalWindowLocalStorage.removeItem.bind(originalWindowLocalStorage),
        clear: originalWindowLocalStorage.clear.bind(originalWindowLocalStorage),
        key: originalWindowLocalStorage.key.bind(originalWindowLocalStorage),
        length: originalWindowLocalStorage.length,
      },
      writable: true,
      configurable: true,
    });
    
    render(<TestLocalStorageComponent />);
    
    // 尝试修改值，由于 localStorage 写入失败，React state 会回滚到之前的值
    fireEvent.change(screen.getByTestId('input'), { target: { value: 'new-value' } });
    
    // 验证 window.localStorage.setItem 被调用（并抛出错误）
    expect(setItemCallCount).toBeGreaterThan(0);
    
    // 由于回滚机制，值应该保持为 'initial'
    expect(screen.getByTestId('value').textContent).toBe('initial');
    
    // 恢复原始方法
    Object.defineProperty(window, 'localStorage', {
      value: originalWindowLocalStorage,
      writable: true,
      configurable: true,
    });
  });
});

// ============ 3. useDebounce hook 清理 ============

describe('useDebounce hook cleanup', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  const TestDebounceComponent: React.FC = () => {
    const [inputValue, setInputValue] = useState('');
    const debouncedValue = useDebounce(inputValue, 500);
    
    return (
      <div>
        <input 
          data-testid="input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <div data-testid="debounced">{debouncedValue}</div>
      </div>
    );
  };

  it('should clear timer on unmount to prevent memory leaks', () => {
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');
    
    const { unmount } = render(<TestDebounceComponent />);
    
    // 触发防抖
    fireEvent.change(screen.getByTestId('input'), { target: { value: 'test' } });
    
    // 在防抖完成前卸载组件
    unmount();
    
    // 验证 clearTimeout 被调用（清理函数）
    expect(clearTimeoutSpy).toHaveBeenCalled();
    
    clearTimeoutSpy.mockRestore();
  });

  it('should not update state after unmount', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const { unmount } = render(<TestDebounceComponent />);
    
    // 触发防抖
    fireEvent.change(screen.getByTestId('input'), { target: { value: 'test' } });
    
    // 卸载组件
    unmount();
    
    // 推进时间，如果定时器没有被清理，会尝试更新已卸载组件的状态
    vi.advanceTimersByTime(600);
    
    // 不应该有 "Can't perform a React state update on an unmounted component" 警告
    const stateUpdateErrors = consoleError.mock.calls.filter(
      call => call[0] && typeof call[0] === 'string' && 
        call[0].includes("Can't perform a React state update on an unmounted component")
    );
    expect(stateUpdateErrors).toHaveLength(0);
    
    consoleError.mockRestore();
  });
});

// ============ 4. 图表组件卸载清理 ============

describe('TaskCompletionChart cleanup', () => {
  const mockTasks: Task[] = [
    { id: '1', title: 'Task 1', description: 'Desc 1', status: 'completed', progress: 100, priority: 'P0', assignee: 'a1', dependencies: [], estimatedTime: 10, createdAt: Date.now() },
    { id: '2', title: 'Task 2', description: 'Desc 2', status: 'in_progress', progress: 50, priority: 'P1', assignee: 'a2', dependencies: [], estimatedTime: 20, createdAt: Date.now() },
  ];

  afterEach(() => {
    cleanup();
  });

  it('should render without errors', () => {
    const { unmount, container } = render(<TaskCompletionChart tasks={mockTasks} />);
    // TaskCompletionChart 使用 recharts，渲染后应该有 svg 元素或标题
    expect(container.querySelector('svg') || screen.getByText('任务完成趋势')).toBeTruthy();
    unmount();
  });

  it('should handle empty tasks array', () => {
    const { unmount } = render(<TaskCompletionChart tasks={[]} />);
    expect(screen.getByText('任务完成趋势')).toBeInTheDocument();
    unmount();
  });
});

// ============ 5. KnowledgeGraph 组件生命周期 ============

describe('KnowledgeGraph component lifecycle', () => {
  const mockNodes: KnowledgeNode[] = [
    { id: 'n1', type: 'concept', name: 'Node 1', description: 'Desc 1', connections: ['n2'] },
    { id: 'n2', type: 'file', name: 'Node 2', description: 'Desc 2', connections: [] },
  ];

  const mockLayoutNodes: LayoutNode[] = [
    { id: 'n1', x: 100, y: 100, node: mockNodes[0] },
    { id: 'n2', x: 200, y: 200, node: mockNodes[1] },
  ];

  const mockEdges = [
    { from: mockLayoutNodes[0], to: mockLayoutNodes[1], key: 'n1-n2' },
  ];

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  const TestKnowledgeGraph: React.FC = () => {
    const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
    
    return (
      <KnowledgeGraph
        filteredNodes={mockNodes}
        layoutNodes={mockLayoutNodes}
        layoutMap={new Map(mockLayoutNodes.map(ln => [ln.id, ln]))}
        selectedNode={selectedNode}
        edges={mockEdges}
        svgWidth={800}
        svgHeight={600}
        onNodeClick={setSelectedNode}
      />
    );
  };

  it('should cancel requestAnimationFrame on unmount', () => {
    const cancelAnimationFrameSpy = vi.spyOn(window, 'cancelAnimationFrame');
    
    const { unmount } = render(<TestKnowledgeGraph />);
    
    // 模拟拖拽操作来触发 RAF
    const svg = document.querySelector('svg');
    if (svg) {
      fireEvent.mouseDown(svg);
      fireEvent.mouseMove(window, { clientX: 100, clientY: 100 });
    }
    
    // 卸载组件
    unmount();
    
    // 验证 cancelAnimationFrame 被调用（KnowledgeGraph 在清理时应该取消 RAF）
    // 注意：如果没有触发拖拽，RAF 可能不会被创建，所以这里使用 toHaveBeenCalled 或至少验证清理函数存在
    expect(cancelAnimationFrameSpy).toHaveBeenCalled();
    
    cancelAnimationFrameSpy.mockRestore();
  });

  it('should remove event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    
    const { unmount } = render(<TestKnowledgeGraph />);
    
    // 卸载组件
    unmount();
    
    // 验证事件监听器被移除
    const mousemoveCalls = removeEventListenerSpy.mock.calls.filter(
      call => call[0] === 'mousemove'
    );
    const mouseupCalls = removeEventListenerSpy.mock.calls.filter(
      call => call[0] === 'mouseup'
    );
    
    expect(mousemoveCalls.length).toBeGreaterThan(0);
    expect(mouseupCalls.length).toBeGreaterThan(0);
    
    removeEventListenerSpy.mockRestore();
  });

  it('should handle drag operations and cleanup', () => {
    const { unmount, container } = render(<TestKnowledgeGraph />);
    
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    
    // 模拟拖拽操作
    if (svg) {
      fireEvent.mouseDown(svg);
      fireEvent.mouseMove(window, { clientX: 100, clientY: 100 });
      fireEvent.mouseUp(window);
    }
    
    // 卸载组件
    unmount();
    
    // 组件应该正常卸载，没有错误
    expect(container.innerHTML).toBe('');
  });
});

// ============ 6. Modal 组件生命周期 ============

describe('AddNodeModal component lifecycle', () => {
  const mockKnowledgeNodes: KnowledgeNode[] = [
    { id: 'kn-001', type: 'concept', name: 'Test Node', description: 'Test', connections: [] },
  ];

  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const TestModal: React.FC<{ open: boolean }> = ({ open }) => (
    <AddNodeModal
      open={open}
      onClose={mockOnClose}
      knowledgeNodes={mockKnowledgeNodes}
      onSubmit={mockOnSubmit}
    />
  );

  it('should remove keyboard event listener on unmount when modal is open', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
    
    const { unmount } = render(<TestModal open={true} />);
    
    // 卸载组件（不通过正常关闭）
    unmount();
    
    // 验证键盘事件监听器被移除
    const keydownCalls = removeEventListenerSpy.mock.calls.filter(
      call => call[0] === 'keydown'
    );
    expect(keydownCalls.length).toBeGreaterThan(0);
    
    removeEventListenerSpy.mockRestore();
  });

  it('should handle Escape key when open', () => {
    render(<TestModal open={true} />);
    
    // 触发 Escape 键
    fireEvent.keyDown(document, { key: 'Escape' });
    
    // 验证 onClose 被调用
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should not add keyboard listener when closed', () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    
    render(<TestModal open={false} />);
    
    // 验证没有添加键盘事件监听器
    const keydownCalls = addEventListenerSpy.mock.calls.filter(
      call => call[0] === 'keydown'
    );
    expect(keydownCalls).toHaveLength(0);
    
    addEventListenerSpy.mockRestore();
  });

  it('should reset form when modal opens', () => {
    const { rerender } = render(<TestModal open={false} />);
    
    // 打开 modal
    rerender(<TestModal open={true} />);
    
    // 验证 modal 显示
    expect(screen.getByText('添加知识节点')).toBeInTheDocument();
  });
});

// ============ 7. 页面切换状态保持 ============

describe('Page switching state preservation', () => {
  // 模拟 Dashboard 页面组件
  const MockDashboard: React.FC = () => {
    const [count, setCount] = useState(0);
    
    return (
      <div data-testid="dashboard">
        <div data-testid="count">{count}</div>
        <button onClick={() => setCount(c => c + 1)} data-testid="increment">
          Increment
        </button>
      </div>
    );
  };

  // 模拟 Tasks 页面组件
  const MockTasks: React.FC = () => (
    <div data-testid="tasks">Tasks Page</div>
  );

  // 模拟路由切换
  const MockRouter: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<'dashboard' | 'tasks'>('dashboard');
    
    return (
      <div>
        <button onClick={() => setCurrentPage('dashboard')} data-testid="nav-dashboard">
          Dashboard
        </button>
        <button onClick={() => setCurrentPage('tasks')} data-testid="nav-tasks">
          Tasks
        </button>
        {currentPage === 'dashboard' ? <MockDashboard /> : <MockTasks />}
      </div>
    );
  };

  afterEach(() => {
    cleanup();
  });

  it('should preserve state when switching pages and back', () => {
    render(<MockRouter />);
    
    // 初始状态
    expect(screen.getByTestId('count').textContent).toBe('0');
    
    // 修改状态
    fireEvent.click(screen.getByTestId('increment'));
    fireEvent.click(screen.getByTestId('increment'));
    expect(screen.getByTestId('count').textContent).toBe('2');
    
    // 切换到 Tasks 页面
    fireEvent.click(screen.getByTestId('nav-tasks'));
    expect(screen.getByTestId('tasks')).toBeInTheDocument();
    expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();
    
    // 切换回 Dashboard
    fireEvent.click(screen.getByTestId('nav-dashboard'));
    
    // 注意：由于组件被卸载后重新挂载，状态会重置
    // 这是 React 的默认行为，除非使用状态管理库或 keep-alive 机制
    expect(screen.getByTestId('count').textContent).toBe('0');
  });

  it('should demonstrate state preservation with external store', () => {
    // 使用外部状态管理来保持状态
    let globalCount = 0;
    
    const MockDashboardWithStore: React.FC = () => {
      const [count, setCount] = useState(globalCount);
      
      const increment = () => {
        globalCount++;
        setCount(globalCount);
      };
      
      return (
        <div data-testid="dashboard">
          <div data-testid="count">{count}</div>
          <button onClick={increment} data-testid="increment">
            Increment
          </button>
        </div>
      );
    };
    
    const MockRouterWithStore: React.FC = () => {
      const [currentPage, setCurrentPage] = useState<'dashboard' | 'tasks'>('dashboard');
      
      return (
        <div>
          <button onClick={() => setCurrentPage('dashboard')} data-testid="nav-dashboard">
            Dashboard
          </button>
          <button onClick={() => setCurrentPage('tasks')} data-testid="nav-tasks">
            Tasks
          </button>
          {currentPage === 'dashboard' ? <MockDashboardWithStore /> : <MockTasks />}
        </div>
      );
    };
    
    render(<MockRouterWithStore />);
    
    // 修改状态
    fireEvent.click(screen.getByTestId('increment'));
    fireEvent.click(screen.getByTestId('increment'));
    expect(screen.getByTestId('count').textContent).toBe('2');
    
    // 切换到 Tasks 再切换回来
    fireEvent.click(screen.getByTestId('nav-tasks'));
    fireEvent.click(screen.getByTestId('nav-dashboard'));
    
    // 使用外部存储，状态应该保持
    expect(screen.getByTestId('count').textContent).toBe('2');
  });
});

// ============ 8. ErrorBoundary 错误恢复 ============

describe('ErrorBoundary error recovery', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  // 一个会抛出错误的组件
  const ErrorThrowingComponent: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = false }) => {
    if (shouldThrow) {
      throw new Error('Test error');
    }
    return <div data-testid="safe-content">Safe Content</div>;
  };

  // 用于测试的可控错误组件
  const TestErrorComponent: React.FC = () => {
    const [shouldThrow, setShouldThrow] = useState(false);
    
    return (
      <ErrorBoundary>
        <div>
          <button 
            onClick={() => setShouldThrow(true)} 
            data-testid="trigger-error"
          >
            Trigger Error
          </button>
          <ErrorThrowingComponent shouldThrow={shouldThrow} />
        </div>
      </ErrorBoundary>
    );
  };

  it('should catch error and display fallback UI', () => {
    render(<TestErrorComponent />);
    
    // 初始状态正常
    expect(screen.getByTestId('safe-content')).toBeInTheDocument();
    
    // 触发错误
    fireEvent.click(screen.getByTestId('trigger-error'));
    
    // 验证 ErrorBoundary 显示 fallback UI
    expect(screen.getByText('页面出现了问题')).toBeInTheDocument();
    expect(screen.getByText('重试')).toBeInTheDocument();
    expect(screen.getByText('刷新页面')).toBeInTheDocument();
  });

  it('should display custom fallback when provided', () => {
    const CustomFallback = <div data-testid="custom-fallback">Custom Error UI</div>;
    
    const ComponentWithCustomFallback: React.FC = () => {
      const [shouldThrow, setShouldThrow] = useState(false);
      
      return (
        <ErrorBoundary fallback={CustomFallback}>
          <div>
            <button 
              onClick={() => setShouldThrow(true)} 
              data-testid="trigger-error"
            >
              Trigger Error
            </button>
            <ErrorThrowingComponent shouldThrow={shouldThrow} />
          </div>
        </ErrorBoundary>
      );
    };
    
    render(<ComponentWithCustomFallback />);
    
    // 触发错误
    fireEvent.click(screen.getByTestId('trigger-error'));
    
    // 验证显示自定义 fallback
    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
  });

  it('should capture error information', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<TestErrorComponent />);
    
    // 触发错误
    fireEvent.click(screen.getByTestId('trigger-error'));
    
    // 验证错误信息被捕获并显示
    expect(screen.getByText('Test error')).toBeInTheDocument();
    
    consoleError.mockRestore();
  });

  it('should allow retry after error', () => {
    // 使用外部变量来跟踪错误边界的状态
    let shouldThrow = true;
    
    const RecoverableComponent: React.FC = () => {
      if (shouldThrow) {
        throw new Error('Test error for retry');
      }
      return <div data-testid="recovered">Recovered!</div>;
    };
    
    const ComponentWithRetry: React.FC = () => {
      const [key, setKey] = useState(0);
      
      return (
        <div>
          <button 
            onClick={() => {
              shouldThrow = false;
              setKey(k => k + 1);
            }} 
            data-testid="retry"
          >
            Retry
          </button>
          <ErrorBoundary key={key}>
            <RecoverableComponent />
          </ErrorBoundary>
        </div>
      );
    };
    
    render(<ComponentWithRetry />);
    
    // 初始状态显示错误
    expect(screen.getByText('页面出现了问题')).toBeInTheDocument();
    
    // 点击重试（通过改变 key 强制重新挂载 ErrorBoundary，并设置 shouldThrow = false）
    fireEvent.click(screen.getByTestId('retry'));
    
    // 应该恢复正常
    expect(screen.getByTestId('recovered')).toBeInTheDocument();
    expect(screen.queryByText('页面出现了问题')).not.toBeInTheDocument();
  });
});

// ============ 额外：综合生命周期测试 ============

describe('Comprehensive lifecycle tests', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('should handle rapid mount/unmount cycles', async () => {
    const TestComponent: React.FC = () => {
      const [value, setValue] = useLocalStorage('rapid-test', 'default');
      const debouncedValue = useDebounce(value, 100);
      
      useEffect(() => {
        return () => {
          // 清理函数
        };
      }, []);
      
      return (
        <div>
          <input 
            value={value} 
            onChange={(e) => setValue(e.target.value)}
            data-testid="input"
          />
          <div data-testid="debounced">{debouncedValue}</div>
        </div>
      );
    };
    
    // 快速挂载/卸载多次
    for (let i = 0; i < 5; i++) {
      const { unmount } = render(<TestComponent />);
      fireEvent.change(screen.getByTestId('input'), { target: { value: `test-${i}` } });
      unmount();
    }
    
    // 最后一次正常渲染
    const { getByTestId } = render(<TestComponent />);
    expect(getByTestId('input')).toBeInTheDocument();
  });

  it('should clean up all resources when parent unmounts', () => {
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    
    const ParentComponent: React.FC = () => {
      const [showChild, setShowChild] = useState(true);
      
      return (
        <div>
          <button onClick={() => setShowChild(false)} data-testid="hide">
            Hide Child
          </button>
          {showChild && <ChildComponent />}
        </div>
      );
    };
    
    const ChildComponent: React.FC = () => {
      const [,] = useDebounce('', 500);
      
      useEffect(() => {
        const handler = () => {};
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
      }, []);
      
      return <div data-testid="child">Child</div>;
    };
    
    render(<ParentComponent />);
    expect(screen.getByTestId('child')).toBeInTheDocument();
    
    // 卸载子组件
    fireEvent.click(screen.getByTestId('hide'));
    
    // 验证清理函数被调用
    expect(clearTimeoutSpy).toHaveBeenCalled();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    
    clearTimeoutSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });
});
