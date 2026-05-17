import { useState, useMemo, useCallback } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import {
  Sun,
  Moon,
  Search,
  BookOpen,
} from 'lucide-react';
import { ErrorBoundary, ToastProvider, GlobalSearchModal, NotFound, Footer } from './components';
import { PageTransition } from './components/animation';
import { useDarkMode } from './hooks/useDarkMode';
import { useKeyboard } from './hooks/useKeyboard';
import { navItems } from './constants/navItems';

import Dashboard from './pages/Dashboard';
import Organization from './pages/Organization';
import Tasks from './pages/Tasks';
import Architecture from './pages/Architecture';
import Evaluation from './pages/Evaluation';
import Tools from './pages/Tools';
import Comparison from './pages/Comparison';
import Messages from './pages/Messages';
import Knowledge from './pages/Knowledge';

function AppContent() {
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const [searchOpen, setSearchOpen] = useState(false);

  const openSearch = useCallback(() => {
    setSearchOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
  }, []);

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
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/organization" element={<Organization />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/knowledge" element={<Knowledge />} />
                  <Route path="/architecture" element={<Architecture />} />
                  <Route path="/comparison" element={<Comparison />} />
                  <Route path="/evaluation" element={<Evaluation />} />
                  <Route path="/tools" element={<Tools />} />
                  <Route path="/404" element={<NotFound />} />
                  <Route path="*" element={<Navigate to="/404" replace />} />
                </Routes>
              </PageTransition>
            </ErrorBoundary>
          </main>

          {/* Footer */}
          <Footer />

          {/* Global Search Modal */}
          <GlobalSearchModal isOpen={searchOpen} onClose={closeSearch} />
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
