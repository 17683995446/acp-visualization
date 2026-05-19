import { useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import {
  Sun,
  Moon,
  Search,
  BookOpen,
  FolderOpen,
  Palette,
} from 'lucide-react';
import { ErrorBoundary, ToastProvider, GlobalSearchModal, NotFound, Footer } from './components';
import ScenarioPanel from './components/ScenarioPanel';
import ThemePanel from './components/ThemePanel';
import { PageTransition } from './components/animation';
import { useDarkMode } from './hooks/useDarkMode';
import { useKeyboard } from './hooks/useKeyboard';
import { navItems } from './constants/navItems';

// 路由级懒加载 — 减少首屏 bundle 体积
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Organization = lazy(() => import('./pages/Organization'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Architecture = lazy(() => import('./pages/Architecture'));
const Evaluation = lazy(() => import('./pages/Evaluation'));
const Tools = lazy(() => import('./pages/Tools'));
const Comparison = lazy(() => import('./pages/Comparison'));
const Messages = lazy(() => import('./pages/Messages'));
const Knowledge = lazy(() => import('./pages/Knowledge'));
const Analytics = lazy(() => import('./pages/Analytics'));

// 页面加载 fallback
function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
    </div>
  );
}

function AppContent() {
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const [searchOpen, setSearchOpen] = useState(false);
  const [scenarioPanelOpen, setScenarioPanelOpen] = useState(false);
  const [themePanelOpen, setThemePanelOpen] = useState(false);

  const openSearch = useCallback(() => {
    setSearchOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
  }, []);

  const handleScenarioPanelClose = useCallback(() => setScenarioPanelOpen(false), []);
  const handleThemePanelClose = useCallback(() => setThemePanelOpen(false), []);

  const shortcuts = useMemo(() => [
    {
      key: 'k',
      ctrlKey: true,
      handler: () => {
        openSearch();
      },
      description: '全局搜索',
    },
    {
      key: '/',
      handler: () => {
        openSearch();
      },
      description: '全局搜索',
    },
    {
      key: 'Escape',
      handler: () => {
        closeSearch();
        document.dispatchEvent(new CustomEvent('close-modals'));
      },
      description: '关闭弹窗',
    },
    {
      key: 'R',
      ctrlKey: true,
      shiftKey: true,
      handler: () => {
        toggleDarkMode();
      },
      description: '切换深色模式',
    },
  ], [toggleDarkMode, openSearch, closeSearch]);

  useKeyboard(shortcuts);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
          {/* Header */}
          <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">A</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">ACP</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Agent Cluster Platform</p>
                  </div>
                </div>

                <nav className="hidden lg:flex space-x-1" role="navigation" aria-label="主导航">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/'}
                      className={({ isActive }) =>
                        `flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`
                      }
                    >
                      <item.icon className="w-4 h-4" aria-hidden="true" />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </nav>

                <div className="flex items-center space-x-2">
                  {/* 主题设置按钮 */}
                  <button
                    onClick={() => setThemePanelOpen(true)}
                    className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title="主题设置"
                  >
                    <Palette className="w-4 h-4" />
                    <span className="hidden sm:inline">主题</span>
                  </button>
                  {/* 场景管理按钮 */}
                  <button
                    onClick={() => setScenarioPanelOpen(true)}
                    className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title="场景管理"
                  >
                    <FolderOpen className="w-4 h-4" />
                    <span className="hidden sm:inline">场景</span>
                  </button>
                  {/* 全局搜索按钮 */}
                  <button
                    onClick={openSearch}
                    className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title="全局搜索 (Ctrl+K)"
                  >
                    <Search className="w-4 h-4" />
                    <span className="hidden sm:inline">搜索</span>
                    <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] text-gray-400 bg-gray-200 dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500">
                      Ctrl+K
                    </kbd>
                  </button>
                  <button
                    onClick={toggleDarkMode}
                    className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label={isDark ? '切换到亮色模式' : '切换到深色模式'}
                    title="切换深色模式 (Ctrl+Shift+R)"
                  >
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>
                  <a
                    href="https://github.com/claude-code-best/claude-code"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 px-3 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                    aria-label="查看项目文档"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span className="hidden sm:inline">文档</span>
                  </a>
                </div>
              </div>
            </div>
          </header>

          {/* Mobile Navigation */}
          <nav className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto sticky top-16 z-30" role="navigation" aria-label="移动端导航">
            <div className="flex space-x-1 px-4 py-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                      isActive
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                        : 'text-gray-600 dark:text-gray-300'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </nav>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
            <ErrorBoundary>
              <PageTransition>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/organization" element={<Organization />} />
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="/knowledge" element={<Knowledge />} />
                    <Route path="/architecture" element={<Architecture />} />
                    <Route path="/comparison" element={<Comparison />} />
                    <Route path="/evaluation" element={<Evaluation />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/tools" element={<Tools />} />
                    <Route path="/404" element={<NotFound />} />
                    <Route path="*" element={<Navigate to="/404" replace />} />
                  </Routes>
                </Suspense>
              </PageTransition>
            </ErrorBoundary>
          </main>

          {/* Footer */}
          <Footer />

          {/* Global Search Modal */}
          <GlobalSearchModal isOpen={searchOpen} onClose={closeSearch} />

          {/* Scenario Panel */}
          <ScenarioPanel isOpen={scenarioPanelOpen} onClose={handleScenarioPanelClose} />

          {/* Theme Panel */}
          <ThemePanel isOpen={themePanelOpen} onClose={handleThemePanelClose} />
        </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
