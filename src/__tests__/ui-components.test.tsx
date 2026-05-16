/**
 * UI 组件单元测试
 * 测试所有 UI 组件的渲染、交互和样式行为
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PriorityBadge } from '../components/ui/PriorityBadge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { SearchBar } from '../components/ui/SearchBar';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Tabs } from '../components/ui/Tabs';
import { PageHeader } from '../components/ui/PageHeader';
import { ViewToggle } from '../components/ui/ViewToggle';
import { EmptyState } from '../components/ui/EmptyState';
import { StatCard } from '../components/ui/StatCard';
import { Inbox, LayoutGrid, List } from 'lucide-react';

// ============ StatusBadge ============

describe('StatusBadge', () => {
  describe('task status labels', () => {
    it('renders correct label for pending task', () => {
      render(<StatusBadge status="pending" type="task" />);
      expect(screen.getByText('待处理')).toBeInTheDocument();
    });

    it('renders correct label for in_progress task', () => {
      render(<StatusBadge status="in_progress" type="task" />);
      expect(screen.getByText('进行中')).toBeInTheDocument();
    });

    it('renders correct label for completed task', () => {
      render(<StatusBadge status="completed" type="task" />);
      expect(screen.getByText('已完成')).toBeInTheDocument();
    });

    it('renders correct label for failed task', () => {
      render(<StatusBadge status="failed" type="task" />);
      expect(screen.getByText('已失败')).toBeInTheDocument();
    });

    it('renders correct label for blocked task', () => {
      render(<StatusBadge status="blocked" type="task" />);
      expect(screen.getByText('已阻塞')).toBeInTheDocument();
    });

    it('renders correct label for scheduled task', () => {
      render(<StatusBadge status="scheduled" type="task" />);
      expect(screen.getByText('已排期')).toBeInTheDocument();
    });
  });

  describe('member status labels', () => {
    it('renders correct label for idle member', () => {
      render(<StatusBadge status="idle" type="member" />);
      expect(screen.getByText('空闲')).toBeInTheDocument();
    });

    it('renders correct label for busy member', () => {
      render(<StatusBadge status="busy" type="member" />);
      expect(screen.getByText('忙碌')).toBeInTheDocument();
    });

    it('renders correct label for offline member', () => {
      render(<StatusBadge status="offline" type="member" />);
      expect(screen.getByText('离线')).toBeInTheDocument();
    });
  });

  describe('color classes', () => {
    it('applies correct color class for pending task', () => {
      render(<StatusBadge status="pending" type="task" />);
      const badge = screen.getByText('待处理');
      expect(badge.className).toContain('bg-gray-100');
      expect(badge.className).toContain('text-gray-700');
    });

    it('applies correct color class for in_progress task', () => {
      render(<StatusBadge status="in_progress" type="task" />);
      const badge = screen.getByText('进行中');
      expect(badge.className).toContain('bg-blue-100');
      expect(badge.className).toContain('text-blue-700');
    });

    it('applies correct color class for completed task', () => {
      render(<StatusBadge status="completed" type="task" />);
      const badge = screen.getByText('已完成');
      expect(badge.className).toContain('bg-green-100');
      expect(badge.className).toContain('text-green-700');
    });

    it('applies correct color class for failed task', () => {
      render(<StatusBadge status="failed" type="task" />);
      const badge = screen.getByText('已失败');
      expect(badge.className).toContain('bg-red-100');
      expect(badge.className).toContain('text-red-700');
    });

    it('applies correct color class for idle member', () => {
      render(<StatusBadge status="idle" type="member" />);
      const badge = screen.getByText('空闲');
      expect(badge.className).toContain('bg-green-100');
      expect(badge.className).toContain('text-green-700');
    });

    it('applies correct color class for busy member', () => {
      render(<StatusBadge status="busy" type="member" />);
      const badge = screen.getByText('忙碌');
      expect(badge.className).toContain('bg-red-100');
      expect(badge.className).toContain('text-red-700');
    });

    it('applies correct color class for offline member', () => {
      render(<StatusBadge status="offline" type="member" />);
      const badge = screen.getByText('离线');
      expect(badge.className).toContain('bg-gray-100');
      expect(badge.className).toContain('text-gray-500');
    });
  });

  describe('size variants', () => {
    it('applies sm size class by default', () => {
      render(<StatusBadge status="pending" type="task" />);
      const badge = screen.getByText('待处理');
      expect(badge.className).toContain('px-2');
      expect(badge.className).toContain('py-0.5');
      expect(badge.className).toContain('text-xs');
    });

    it('applies md size class when specified', () => {
      render(<StatusBadge status="pending" type="task" size="md" />);
      const badge = screen.getByText('待处理');
      expect(badge.className).toContain('px-3');
      expect(badge.className).toContain('py-1');
      expect(badge.className).toContain('text-sm');
    });
  });

  describe('unknown status', () => {
    it('renders raw status string for unknown task status', () => {
      render(<StatusBadge status="unknown_status" type="task" />);
      expect(screen.getByText('unknown_status')).toBeInTheDocument();
    });
  });
});

// ============ PriorityBadge ============

describe('PriorityBadge', () => {
  describe('renders correct label', () => {
    it('renders P0 label', () => {
      render(<PriorityBadge priority="P0" />);
      expect(screen.getByText('P0')).toBeInTheDocument();
    });

    it('renders P1 label', () => {
      render(<PriorityBadge priority="P1" />);
      expect(screen.getByText('P1')).toBeInTheDocument();
    });

    it('renders P2 label', () => {
      render(<PriorityBadge priority="P2" />);
      expect(screen.getByText('P2')).toBeInTheDocument();
    });

    it('renders P3 label', () => {
      render(<PriorityBadge priority="P3" />);
      expect(screen.getByText('P3')).toBeInTheDocument();
    });
  });

  describe('color classes', () => {
    it('applies red color for P0', () => {
      render(<PriorityBadge priority="P0" />);
      const badge = screen.getByText('P0');
      expect(badge.className).toContain('bg-red-100');
      expect(badge.className).toContain('text-red-800');
    });

    it('applies orange color for P1', () => {
      render(<PriorityBadge priority="P1" />);
      const badge = screen.getByText('P1');
      expect(badge.className).toContain('bg-orange-100');
      expect(badge.className).toContain('text-orange-800');
    });

    it('applies yellow color for P2', () => {
      render(<PriorityBadge priority="P2" />);
      const badge = screen.getByText('P2');
      expect(badge.className).toContain('bg-yellow-100');
      expect(badge.className).toContain('text-yellow-800');
    });

    it('applies gray color for P3', () => {
      render(<PriorityBadge priority="P3" />);
      const badge = screen.getByText('P3');
      expect(badge.className).toContain('bg-gray-100');
      expect(badge.className).toContain('text-gray-600');
    });
  });

  describe('size variants', () => {
    it('applies sm size by default', () => {
      render(<PriorityBadge priority="P0" />);
      const badge = screen.getByText('P0');
      expect(badge.className).toContain('px-2');
      expect(badge.className).toContain('text-xs');
    });

    it('applies md size when specified', () => {
      render(<PriorityBadge priority="P0" size="md" />);
      const badge = screen.getByText('P0');
      expect(badge.className).toContain('px-3');
      expect(badge.className).toContain('text-sm');
    });
  });
});

// ============ ProgressBar ============

describe('ProgressBar', () => {
  it('renders with correct percentage text', () => {
    render(<ProgressBar value={75} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('renders 0% when value is 0', () => {
    render(<ProgressBar value={0} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('renders 100% when value exceeds max', () => {
    render(<ProgressBar value={150} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('calculates percentage based on custom max', () => {
    render(<ProgressBar value={3} max={4} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('applies custom color function', () => {
    const colorFn = vi.fn().mockReturnValue('bg-purple-500');
    render(<ProgressBar value={50} colorFn={colorFn} />);
    expect(colorFn).toHaveBeenCalledWith(50);
    const bar = document.querySelector('[role="progressbar"]');
    expect(bar?.className).toContain('bg-purple-500');
  });

  it('uses default color function when none provided', () => {
    render(<ProgressBar value={90} />);
    const bar = document.querySelector('[role="progressbar"]');
    expect(bar?.className).toContain('bg-green-500');
  });

  it('renders label when provided', () => {
    render(<ProgressBar value={50} label="Progress" />);
    expect(screen.getByText('Progress')).toBeInTheDocument();
  });

  it('hides percentage text when showPercentage is false', () => {
    render(<ProgressBar value={50} showPercentage={false} />);
    expect(screen.queryByText('50%')).not.toBeInTheDocument();
  });

  it('sets correct aria attributes on progressbar', () => {
    render(<ProgressBar value={60} max={100} />);
    const bar = document.querySelector('[role="progressbar"]');
    expect(bar).toHaveAttribute('aria-valuenow', '60');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  it('applies correct height class for different sizes', () => {
    const { rerender } = render(<ProgressBar value={50} size="sm" />);
    let bar = document.querySelector('[role="progressbar"]');
    expect(bar?.className).toContain('h-1.5');

    rerender(<ProgressBar value={50} size="lg" />);
    bar = document.querySelector('[role="progressbar"]');
    expect(bar?.className).toContain('h-4');

    rerender(<ProgressBar value={50} size="md" />);
    bar = document.querySelector('[role="progressbar"]');
    expect(bar?.className).toContain('h-2.5');
  });
});

// ============ SearchBar ============

describe('SearchBar', () => {
  it('renders with default placeholder', () => {
    render(<SearchBar value="" onChange={vi.fn()} />);
    const input = screen.getByPlaceholderText('搜索...');
    expect(input).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(<SearchBar value="" onChange={vi.fn()} placeholder="Search tasks..." />);
    expect(screen.getByPlaceholderText('Search tasks...')).toBeInTheDocument();
  });

  it('calls onChange when typing', () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);
    const input = screen.getByPlaceholderText('搜索...');
    fireEvent.change(input, { target: { value: 'hello' } });
    expect(onChange).toHaveBeenCalledWith('hello');
  });

  it('shows clear button when has value', () => {
    render(<SearchBar value="test" onChange={vi.fn()} />);
    const clearButton = screen.getByRole('button');
    expect(clearButton).toBeInTheDocument();
  });

  it('does not show clear button when value is empty', () => {
    render(<SearchBar value="" onChange={vi.fn()} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls onChange with empty string when clear button clicked', () => {
    const onChange = vi.fn();
    render(<SearchBar value="test" onChange={onChange} />);
    const clearButton = screen.getByRole('button');
    fireEvent.click(clearButton);
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('reflects the current value in the input', () => {
    render(<SearchBar value="existing value" onChange={vi.fn()} />);
    const input = screen.getByDisplayValue('existing value');
    expect(input).toBeInTheDocument();
  });
});

// ============ Badge ============

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('renders with default variant styles', () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByText('Default');
    expect(badge.className).toContain('bg-gray-100');
    expect(badge.className).toContain('text-gray-700');
  });

  it('renders with primary variant', () => {
    render(<Badge variant="primary">Primary</Badge>);
    const badge = screen.getByText('Primary');
    expect(badge.className).toContain('bg-primary-100');
    expect(badge.className).toContain('text-primary-700');
  });

  it('renders with success variant', () => {
    render(<Badge variant="success">Success</Badge>);
    const badge = screen.getByText('Success');
    expect(badge.className).toContain('bg-green-100');
    expect(badge.className).toContain('text-green-700');
  });

  it('renders with warning variant', () => {
    render(<Badge variant="warning">Warning</Badge>);
    const badge = screen.getByText('Warning');
    expect(badge.className).toContain('bg-orange-100');
    expect(badge.className).toContain('text-orange-700');
  });

  it('renders with danger variant', () => {
    render(<Badge variant="danger">Danger</Badge>);
    const badge = screen.getByText('Danger');
    expect(badge.className).toContain('bg-red-100');
    expect(badge.className).toContain('text-red-700');
  });

  it('renders with info variant', () => {
    render(<Badge variant="info">Info</Badge>);
    const badge = screen.getByText('Info');
    expect(badge.className).toContain('bg-blue-100');
    expect(badge.className).toContain('text-blue-700');
  });

  it('shows dot when dot=true', () => {
    const { container } = render(<Badge dot>Dot Badge</Badge>);
    const dot = container.querySelector('.rounded-full.w-1\\.5');
    expect(dot).toBeInTheDocument();
  });

  it('does not show dot when dot is not set', () => {
    const { container } = render(<Badge>No Dot</Badge>);
    const dot = container.querySelector('.w-1\\.5');
    expect(dot).not.toBeInTheDocument();
  });

  it('applies correct dot color for variant', () => {
    const { container } = render(<Badge variant="success" dot>Success Dot</Badge>);
    const dot = container.querySelector('.bg-green-500');
    expect(dot).toBeInTheDocument();
  });

  it('shows remove button when removable=true', () => {
    render(<Badge removable>Removable</Badge>);
    const removeButton = screen.getByRole('button');
    expect(removeButton).toBeInTheDocument();
  });

  it('does not show remove button when removable=false', () => {
    render(<Badge>Not Removable</Badge>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls onRemove when remove button clicked', () => {
    const onRemove = vi.fn();
    render(<Badge removable onRemove={onRemove}>Remove Me</Badge>);
    const removeButton = screen.getByRole('button');
    fireEvent.click(removeButton);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('applies sm size by default', () => {
    render(<Badge>Small</Badge>);
    const badge = screen.getByText('Small');
    expect(badge.className).toContain('px-2');
    expect(badge.className).toContain('text-xs');
  });

  it('applies md size when specified', () => {
    render(<Badge size="md">Medium</Badge>);
    const badge = screen.getByText('Medium');
    expect(badge.className).toContain('px-3');
    expect(badge.className).toContain('text-sm');
  });

  it('applies custom className', () => {
    render(<Badge className="extra-class">Custom</Badge>);
    const badge = screen.getByText('Custom');
    expect(badge.className).toContain('extra-class');
  });
});

// ============ Avatar ============

describe('Avatar', () => {
  it('renders with first letter of name', () => {
    render(<Avatar name="Alice" />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('renders with first letter for single character name', () => {
    render(<Avatar name="B" />);
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('renders with first letter for Chinese name', () => {
    render(<Avatar name="张三" />);
    expect(screen.getByText('张')).toBeInTheDocument();
  });

  describe('sizes', () => {
    it('applies sm size classes', () => {
      render(<Avatar name="Small" size="sm" />);
      const avatar = screen.getByText('S').closest('div');
      expect(avatar?.className).toContain('w-6');
      expect(avatar?.className).toContain('h-6');
      expect(avatar?.className).toContain('text-xs');
    });

    it('applies md size classes by default', () => {
      render(<Avatar name="Medium" />);
      const avatar = screen.getByText('M').closest('div');
      expect(avatar?.className).toContain('w-8');
      expect(avatar?.className).toContain('h-8');
      expect(avatar?.className).toContain('text-sm');
    });

    it('applies lg size classes', () => {
      render(<Avatar name="Large" size="lg" />);
      const avatar = screen.getByText('L').closest('div');
      expect(avatar?.className).toContain('w-10');
      expect(avatar?.className).toContain('h-10');
      expect(avatar?.className).toContain('text-base');
    });
  });

  describe('status dot', () => {
    it('shows status dot when status prop is provided', () => {
      const { container } = render(<Avatar name="Test" status="idle" />);
      const dot = container.querySelector('.bg-green-500');
      expect(dot).toBeInTheDocument();
    });

    it('shows red dot for busy status', () => {
      const { container } = render(<Avatar name="Test" status="busy" />);
      const dot = container.querySelector('.bg-red-500');
      expect(dot).toBeInTheDocument();
    });

    it('shows gray dot for offline status', () => {
      const { container } = render(<Avatar name="Test" status="offline" />);
      const dot = container.querySelector('.bg-gray-400');
      expect(dot).toBeInTheDocument();
    });

    it('does not show status dot when status is not provided', () => {
      const { container } = render(<Avatar name="Test" />);
      const dot = container.querySelector('.rounded-full.border-2');
      expect(dot).not.toBeInTheDocument();
    });
  });

  describe('image source', () => {
    it('renders image when src is provided', () => {
      render(<Avatar name="Test" src="https://example.com/avatar.jpg" />);
      const img = screen.getByRole('img');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
      expect(img).toHaveAttribute('alt', "Test's avatar");
    });

    it('does not render first letter when src is provided', () => {
      render(<Avatar name="Test" src="https://example.com/avatar.jpg" />);
      expect(screen.queryByText('T')).not.toBeInTheDocument();
    });
  });
});

// ============ Tabs ============

describe('Tabs', () => {
  const mockItems = [
    { key: 'tab1', label: 'Tab 1' },
    { key: 'tab2', label: 'Tab 2' },
    { key: 'tab3', label: 'Tab 3' },
  ];

  it('renders all tab items', () => {
    render(<Tabs items={mockItems} activeKey="tab1" onChange={vi.fn()} />);
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
    expect(screen.getByText('Tab 3')).toBeInTheDocument();
  });

  it('calls onChange when tab is clicked', () => {
    const onChange = vi.fn();
    render(<Tabs items={mockItems} activeKey="tab1" onChange={onChange} />);
    fireEvent.click(screen.getByText('Tab 2'));
    expect(onChange).toHaveBeenCalledWith('tab2');
  });

  it('applies active styles to active tab (underline variant)', () => {
    render(<Tabs items={mockItems} activeKey="tab1" onChange={vi.fn()} variant="underline" />);
    const activeTab = screen.getByText('Tab 1').closest('button');
    expect(activeTab?.className).toContain('border-primary-500');
    expect(activeTab?.className).toContain('text-primary-600');
  });

  it('applies inactive styles to non-active tab (underline variant)', () => {
    render(<Tabs items={mockItems} activeKey="tab1" onChange={vi.fn()} variant="underline" />);
    const inactiveTab = screen.getByText('Tab 2').closest('button');
    expect(inactiveTab?.className).toContain('border-transparent');
  });

  it('applies active styles for pill variant', () => {
    render(<Tabs items={mockItems} activeKey="tab1" onChange={vi.fn()} variant="pill" />);
    const activeTab = screen.getByText('Tab 1').closest('button');
    expect(activeTab?.className).toContain('bg-primary-100');
    expect(activeTab?.className).toContain('text-primary-700');
  });

  it('shows count badge when count is provided', () => {
    const itemsWithCount = [
      { key: 'tab1', label: 'Tab 1', count: 5 },
      { key: 'tab2', label: 'Tab 2', count: 0 },
    ];
    render(<Tabs items={itemsWithCount} activeKey="tab1" onChange={vi.fn()} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('does not show count badge when count is undefined', () => {
    render(<Tabs items={mockItems} activeKey="tab1" onChange={vi.fn()} />);
    // No numeric count badges should be present (the tab labels are not numbers)
    const allButtons = screen.getAllByRole('button');
    allButtons.forEach(btn => {
      // Each button should only contain the label text, not a separate count span
      expect(btn.textContent).not.toMatch(/^\d+$/);
    });
  });

  it('renders icon when provided', () => {
    const itemsWithIcon = [
      { key: 'tab1', label: 'Inbox', icon: Inbox },
      { key: 'tab2', label: 'No Icon' },
    ];
    const { container } = render(<Tabs items={itemsWithIcon} activeKey="tab1" onChange={vi.fn()} />);
    // The Inbox icon should render an SVG
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(1);
  });
});

// ============ PageHeader ============

describe('PageHeader', () => {
  it('renders title', () => {
    render(<PageHeader title="Dashboard" />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders title and description', () => {
    render(<PageHeader title="Dashboard" description="Overview of your organization" />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Overview of your organization')).toBeInTheDocument();
  });

  it('renders action buttons', () => {
    render(
      <PageHeader
        title="Dashboard"
        actions={<button type="button">Add New</button>}
      />
    );
    expect(screen.getByText('Add New')).toBeInTheDocument();
  });

  it('renders multiple action buttons', () => {
    render(
      <PageHeader
        title="Dashboard"
        actions={
          <>
            <button type="button">Action 1</button>
            <button type="button">Action 2</button>
          </>
        }
      />
    );
    expect(screen.getByText('Action 1')).toBeInTheDocument();
    expect(screen.getByText('Action 2')).toBeInTheDocument();
  });

  it('renders badges', () => {
    render(
      <PageHeader
        title="Tasks"
        badges={[
          { label: 'Active', variant: 'success' },
          { label: 'Critical', variant: 'danger' },
        ]}
      />
    );
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('renders title, description, actions, and badges together', () => {
    render(
      <PageHeader
        title="Tasks"
        description="Manage your tasks"
        badges={[{ label: '3 Active', variant: 'info' }]}
        actions={<button type="button">New Task</button>}
      />
    );
    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(screen.getByText('Manage your tasks')).toBeInTheDocument();
    expect(screen.getByText('3 Active')).toBeInTheDocument();
    expect(screen.getByText('New Task')).toBeInTheDocument();
  });

  it('does not render description section when neither description nor badges are provided', () => {
    const { container } = render(<PageHeader title="Simple" />);
    // The description/badges wrapper div should not exist
    const descSection = container.querySelector('.space-x-2');
    expect(descSection).not.toBeInTheDocument();
  });
});

// ============ ViewToggle ============

describe('ViewToggle', () => {
  const mockOptions = [
    { key: 'grid', label: 'Grid', icon: LayoutGrid },
    { key: 'list', label: 'List', icon: List },
  ];

  it('renders all options', () => {
    render(<ViewToggle options={mockOptions} activeKey="grid" onChange={vi.fn()} />);
    expect(screen.getByText('Grid')).toBeInTheDocument();
    expect(screen.getByText('List')).toBeInTheDocument();
  });

  it('calls onChange when option is clicked', () => {
    const onChange = vi.fn();
    render(<ViewToggle options={mockOptions} activeKey="grid" onChange={onChange} />);
    fireEvent.click(screen.getByText('List'));
    expect(onChange).toHaveBeenCalledWith('list');
  });

  it('applies active styles to active option', () => {
    render(<ViewToggle options={mockOptions} activeKey="grid" onChange={vi.fn()} />);
    const activeButton = screen.getByText('Grid').closest('button');
    expect(activeButton?.className).toContain('bg-white');
    expect(activeButton?.className).toContain('shadow-sm');
  });

  it('applies inactive styles to non-active option', () => {
    render(<ViewToggle options={mockOptions} activeKey="grid" onChange={vi.fn()} />);
    const inactiveButton = screen.getByText('List').closest('button');
    expect(inactiveButton?.className).toContain('text-gray-600');
    expect(inactiveButton?.className).not.toContain('bg-white');
  });

  it('renders icons for each option', () => {
    const { container } = render(<ViewToggle options={mockOptions} activeKey="grid" onChange={vi.fn()} />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(2);
  });
});

// ============ EmptyState ============

describe('EmptyState', () => {
  it('renders icon', () => {
    const { container } = render(<EmptyState icon={Inbox} title="No data" />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(1);
  });

  it('renders title', () => {
    render(<EmptyState icon={Inbox} title="No data found" />);
    expect(screen.getByText('No data found')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<EmptyState icon={Inbox} title="No data" description="Try adding some items" />);
    expect(screen.getByText('Try adding some items')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    render(<EmptyState icon={Inbox} title="No data" />);
    expect(screen.queryByText('Try adding some items')).not.toBeInTheDocument();
  });

  it('renders action slot when provided', () => {
    render(
      <EmptyState
        icon={Inbox}
        title="No data"
        action={<button type="button">Add Item</button>}
      />
    );
    expect(screen.getByText('Add Item')).toBeInTheDocument();
  });

  it('does not render action slot when not provided', () => {
    render(<EmptyState icon={Inbox} title="No data" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders all elements together', () => {
    render(
      <EmptyState
        icon={Inbox}
        title="Empty"
        description="Nothing here"
        action={<button type="button">Create</button>}
      />
    );
    expect(screen.getByText('Empty')).toBeInTheDocument();
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();
  });
});

// ============ StatCard ============

describe('StatCard', () => {
  it('renders label', () => {
    render(<StatCard label="Total Tasks" value={42} icon={Inbox} gradient="from-blue-500 to-purple-500" />);
    expect(screen.getByText('Total Tasks')).toBeInTheDocument();
  });

  it('renders value', () => {
    render(<StatCard label="Tasks" value={42} icon={Inbox} gradient="from-blue-500 to-purple-500" />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders string value', () => {
    render(<StatCard label="Status" value="Active" icon={Inbox} gradient="from-blue-500 to-purple-500" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(
      <StatCard
        label="Tasks"
        value={42}
        icon={Inbox}
        gradient="from-blue-500 to-purple-500"
        subtitle="+5 from last week"
      />
    );
    expect(screen.getByText('+5 from last week')).toBeInTheDocument();
  });

  it('does not render subtitle when not provided', () => {
    render(<StatCard label="Tasks" value={42} icon={Inbox} gradient="from-blue-500 to-purple-500" />);
    expect(screen.queryByText('+5 from last week')).not.toBeInTheDocument();
  });

  it('renders icon', () => {
    const { container } = render(<StatCard label="Tasks" value={42} icon={Inbox} gradient="from-blue-500 to-purple-500" />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(1);
  });

  it('applies gradient class', () => {
    const { container } = render(<StatCard label="Tasks" value={42} icon={Inbox} gradient="from-blue-500 to-purple-500" />);
    const gradientDiv = container.querySelector('.bg-gradient-to-br');
    expect(gradientDiv?.className).toContain('from-blue-500');
    expect(gradientDiv?.className).toContain('to-purple-500');
  });
});
