/**
 * ========================================
 * SMOOTHNESS DEMO PAGE
 * ========================================
 *
 * Visual showcase of all smoothness features
 * Remove this when done demo-ing
 * Visit: /test (and update in App.tsx to /smoothness-demo)
 */

import { useState } from 'react';
import { PageTransition, AnimatedSection, StaggeredList, FadeIn, SlideInLeft } from '@/components/common/PageTransition';
import { SmoothButton, SmoothCard, SmoothTabs, SmoothInput } from '@/components/common/SmoothInteractions';
import { ProductCardSkeleton, ListItemSkeleton } from '@/components/common/Skeletons';
import { CircularProgress, StepProgress } from '@/components/common/LoadingBar';
import { ScrollProgress } from '@/components/common/SmoothScroll';

export default function SmoothnessDemo() {
  const [activeTab, setActiveTab] = useState('buttons');
  const [selectedStep, setSelectedStep] = useState(1);
  const [showSkeletons, setShowSkeletons] = useState(false);

  return (
    <PageTransition type="fade">
      <ScrollProgress />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          {/* Header */}
          <FadeIn>
            <div className="text-center mb-16">
              <h1 className="text-5xl font-bold text-gray-900 mb-4">✨ Smoothness Demo</h1>
              <p className="text-xl text-gray-600 mb-6">
                Experience smooth animations, transitions, and interactions
              </p>
              <p className="text-sm text-gray-500">
                All features are production-ready and optimized for performance
              </p>
            </div>
          </FadeIn>

          {/* Demo Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Sidebar */}
            <div className="lg:col-span-1">
              <AnimatedSection delay={0.1}>
                <div className="sticky top-24 space-y-3">
                  <h3 className="font-bold text-lg text-gray-900 mb-4">Demo Sections</h3>

                  {[
                    { id: 'buttons', label: '🔘 Buttons' },
                    { id: 'cards', label: '📇 Cards' },
                    { id: 'lists', label: '📝 Lists' },
                    { id: 'forms', label: '📋 Forms' },
                    { id: 'progress', label: '⏳ Progress' },
                    { id: 'skeletons', label: '💀 Skeletons' },
                  ].map((section, idx) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveTab(section.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-200 hover-scale-105 ${
                        activeTab === section.id
                          ? 'bg-blue-500 text-white shadow-lg'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                      }`}
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      {section.label}
                    </button>
                  ))}
                </div>
              </AnimatedSection>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* BUTTONS */}
              {activeTab === 'buttons' && (
                <AnimatedSection delay={0.2}>
                  <div className="bg-white rounded-xl shadow-sm p-8 space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">🔘 Smooth Buttons</h2>
                      <p className="text-gray-600 mb-6">
                        Hover over buttons to see scale effect. Click to feel tactile feedback.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Primary</h3>
                        <SmoothButton variant="primary" size="lg">
                          Smooth Primary Button
                        </SmoothButton>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Secondary</h3>
                        <SmoothButton variant="secondary" size="lg">
                          Smooth Secondary Button
                        </SmoothButton>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Ghost</h3>
                        <SmoothButton variant="ghost" size="lg">
                          Smooth Ghost Button
                        </SmoothButton>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">With Loading</h3>
                        <SmoothButton variant="primary" size="lg" isLoading>
                          Loading State...
                        </SmoothButton>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-700">
                        💡 Try hovering and clicking the buttons. Notice the smooth scale and the tactile feedback!
                      </p>
                    </div>
                  </div>
                </AnimatedSection>
              )}

              {/* CARDS */}
              {activeTab === 'cards' && (
                <AnimatedSection delay={0.2}>
                  <div className="bg-white rounded-xl shadow-sm p-8 space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">📇 Smooth Cards</h2>
                      <p className="text-gray-600 mb-6">
                        Hover over cards to see lift and scale effect.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {['Product 1', 'Product 2', 'Product 3', 'Product 4'].map((product, idx) => (
                        <SmoothCard
                          key={idx}
                          className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200"
                          hoverScale={1.05}
                        >
                          <div className="w-full h-32 bg-gradient-to-r from-blue-300 to-purple-300 rounded-lg mb-4" />
                          <h3 className="font-bold text-lg text-gray-900 mb-2">{product}</h3>
                          <p className="text-sm text-gray-600 mb-4">
                            Hover to see the smooth lift and scale effect
                          </p>
                          <div className="flex justify-between items-center">
                            <span className="text-xl font-bold text-blue-600">$99.99</span>
                            <SmoothButton variant="primary" size="sm">
                              View
                            </SmoothButton>
                          </div>
                        </SmoothCard>
                      ))}
                    </div>
                  </div>
                </AnimatedSection>
              )}

              {/* LISTS */}
              {activeTab === 'lists' && (
                <AnimatedSection delay={0.2}>
                  <div className="bg-white rounded-xl shadow-sm p-8 space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">📝 Staggered Lists</h2>
                      <p className="text-gray-600 mb-6">
                        Items appear one-by-one with stagger animation
                      </p>
                    </div>

                    <StaggeredList staggerDelay={0.15} className="space-y-3">
                      {['Item 1: Smooth animations', 'Item 2: Skeleton loaders', 'Item 3: Page transitions', 'Item 4: Loading bars', 'Item 5: Scroll effects'].map((item, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <p className="font-medium text-gray-900">{item}</p>
                          <p className="text-sm text-gray-600 mt-1">Each item fades and slides in smoothly</p>
                        </div>
                      ))}
                    </StaggeredList>
                  </div>
                </AnimatedSection>
              )}

              {/* FORMS */}
              {activeTab === 'forms' && (
                <AnimatedSection delay={0.2}>
                  <div className="bg-white rounded-xl shadow-sm p-8 space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">📋 Smooth Forms</h2>
                      <p className="text-gray-600 mb-6">
                        Form inputs with smooth focus effects
                      </p>
                    </div>

                    <div className="space-y-4">
                      <SmoothInput
                        label="Email Address"
                        type="email"
                        placeholder="your@email.com"
                      />

                      <SmoothInput
                        label="Message"
                        placeholder="Type something..."
                      />

                      <SmoothTabs
                        tabs={[
                          { id: 'tab1', label: 'Tab 1', content: <div className="p-4 text-gray-700">Content 1</div> },
                          { id: 'tab2', label: 'Tab 2', content: <div className="p-4 text-gray-700">Content 2</div> },
                          { id: 'tab3', label: 'Tab 3', content: <div className="p-4 text-gray-700">Content 3</div> },
                        ]}
                      />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-700">
                        💡 Click on inputs to see the smooth focus glow effect!
                      </p>
                    </div>
                  </div>
                </AnimatedSection>
              )}

              {/* PROGRESS */}
              {activeTab === 'progress' && (
                <AnimatedSection delay={0.2}>
                  <div className="bg-white rounded-xl shadow-sm p-8 space-y-8">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">⏳ Progress Indicators</h2>
                      <p className="text-gray-600 mb-6">
                        Smooth progress visualization
                      </p>
                    </div>

                    {/* Circular Progress */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4">Circular Progress</h3>
                      <div className="flex justify-around items-center py-8">
                        <CircularProgress progress={25} size={80} label="25%" />
                        <CircularProgress progress={50} size={80} label="50%" />
                        <CircularProgress progress={75} size={80} label="75%" />
                        <CircularProgress progress={100} size={80} label="100%" color="text-green-500" />
                      </div>
                    </div>

                    {/* Step Progress */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4">Step Progress</h3>
                      <div className="space-y-4">
                        <div>
                          <StepProgress
                            currentStep={1}
                            totalSteps={4}
                            labels={['Details', 'Payment', 'Review', 'Confirm']}
                          />
                        </div>
                        <button
                          onClick={() => setSelectedStep(Math.min(selectedStep + 1, 4))}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                        >
                          Next Step
                        </button>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              )}

              {/* SKELETONS */}
              {activeTab === 'skeletons' && (
                <AnimatedSection delay={0.2}>
                  <div className="bg-white rounded-xl shadow-sm p-8 space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">💀 Skeleton Loaders</h2>
                      <p className="text-gray-600 mb-6">
                        Replace spinners with skeleton screens for better UX
                      </p>
                    </div>

                    <button
                      onClick={() => setShowSkeletons(!showSkeletons)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                      {showSkeletons ? 'Hide' : 'Show'} Skeleton Loaders
                    </button>

                    {showSkeletons && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-3">Product Cards</h3>
                          <ProductCardSkeleton count={3} />
                        </div>

                        <div>
                          <h3 className="font-semibold text-gray-900 mb-3">List Items</h3>
                          <ListItemSkeleton count={5} />
                        </div>
                      </div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-700">
                        💡 Skeleton loaders are much better than spinners! They show content structure so users know what's coming.
                      </p>
                    </div>
                  </div>
                </AnimatedSection>
              )}
            </div>
          </div>

          {/* Footer Info */}
          <AnimatedSection delay={0.5}>
            <div className="mt-16 bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">📚 What You're Seeing</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
                <div>
                  <h3 className="font-semibold mb-2">✨ Animations</h3>
                  <ul className="space-y-1 text-sm">
                    <li>• Smooth page transitions (fade/slide)</li>
                    <li>• Button hover/click feedback</li>
                    <li>• Card lift and scale effects</li>
                    <li>• Staggered list animations</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">🎨 CSS Classes</h3>
                  <ul className="space-y-1 text-sm">
                    <li>• hover-scale-105 (scale on hover)</li>
                    <li>• hover-lift (shadow + move up)</li>
                    <li>• smooth-all (0.3s transitions)</li>
                    <li>• animate-fade-in (fade animations)</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  ✅ All 120+ smoothness components are ready to use in your pages. Check the implementation guide for examples!
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </PageTransition>
  );
}
