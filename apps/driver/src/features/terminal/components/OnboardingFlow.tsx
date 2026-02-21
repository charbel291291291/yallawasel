import React, { useState } from 'react';
import { useDriverStore } from '../../../store/useDriverStore';
import { useI18n } from '../../../hooks/useI18n';
import { usePWA } from '../../../hooks/usePWA';

export const OnboardingFlow: React.FC = () => {
    const { completeOnboarding, setLanguage, language } = useDriverStore();
    const { t } = useI18n();
    const { promptInstall, canInstall } = usePWA();
    const [step, setStep] = useState(1);

    const steps = [
        {
            icon: 'fa-language',
            title: 'Tactical Interface',
            desc: 'Select your preferred operational language.',
            component: (
                <div className="flex gap-4 w-full mt-8">
                    <button
                        onClick={() => setLanguage('en')}
                        className={`flex-1 p-6 rounded-2xl border transition-all ${language === 'en' ? 'bg-red-600 border-red-600 text-white' : 'bg-white/5 border-white/10 text-white/40'}`}
                    >
                        <span className="text-sm font-black uppercase tracking-widest">English</span>
                    </button>
                    <button
                        onClick={() => setLanguage('ar')}
                        className={`flex-1 p-6 rounded-2xl border transition-all ${language === 'ar' ? 'bg-red-600 border-red-600 text-white' : 'bg-white/5 border-white/10 text-white/40'}`}
                    >
                        <span className="text-sm font-black uppercase tracking-widest">العربية</span>
                    </button>
                </div>
            )
        },
        {
            icon: 'fa-crosshairs',
            title: t('onboarding.step1_title'),
            desc: t('onboarding.step1_desc'),
        },
        {
            icon: 'fa-chart-line',
            title: t('onboarding.step2_title'),
            desc: t('onboarding.step2_desc'),
        },
        {
            icon: 'fa-mobile-screen-button',
            title: t('onboarding.pwa_prompt'),
            desc: 'Add terminal to your home screen for immediate satellite uplink and reliability.',
            component: canInstall ? (
                <button
                    onClick={promptInstall}
                    className="mt-8 px-8 py-4 bg-red-600/10 border border-red-600/20 rounded-2xl text-red-600 font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"
                >
                    INSTALL TERMINAL NOW
                </button>
            ) : null
        }
    ];

    const currentStep = steps[step - 1];

    const handleNext = () => {
        if (step < steps.length) {
            setStep(step + 1);
        } else {
            completeOnboarding();
        }
    };

    return (
        <div className="fixed inset-0 bg-[#0E0E11] z-[1000] flex flex-col items-center justify-center p-8 text-center select-none overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/5 blur-[120px] rounded-full animate-pulse"></div>
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
            </div>

            <main className="relative z-10 w-full max-w-sm flex flex-col items-center animate-entrance">
                <div className="flex gap-2 mb-12">
                    {steps.map((_, i) => (
                        <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i + 1 === step ? 'w-8 bg-red-600' : 'w-2 bg-white/10'}`}></div>
                    ))}
                </div>

                <div className="w-24 h-24 bg-red-600/10 rounded-[2rem] border border-red-600/20 flex items-center justify-center mb-10 transition-transform duration-500 hover:scale-105">
                    <i className={`fas ${currentStep.icon} text-red-600 text-3xl`}></i>
                </div>

                <h2 className="text-3xl font-black text-white tracking-widest uppercase mb-4 leading-tight">
                    {currentStep.title}
                </h2>
                <p className="text-[11px] font-bold text-white/30 uppercase tracking-[0.2em] leading-relaxed max-w-[280px]">
                    {currentStep.desc}
                </p>

                {currentStep.component}

                <div className="w-full mt-16 space-y-4">
                    <button
                        onClick={handleNext}
                        className="w-full bg-white text-black font-black py-6 rounded-2xl text-[11px] uppercase tracking-[0.3em] active:scale-95 transition-all shadow-xl shadow-white/5"
                    >
                        {step === steps.length ? t('onboarding.get_started') : 'Continue Transition'}
                    </button>

                    {step > 1 && (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] py-2 hover:text-white/40 transition-colors"
                        >
                            Previous Phase
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
};
