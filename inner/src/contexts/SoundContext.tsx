import React, {
    createContext,
    useCallback,
    useContext,
    useRef,
    useState,
} from 'react';
import clickSfx from '../assets/audio/sfx/click.wav';
import errorSfx from '../assets/audio/sfx/error.wav';
import startupSfx from '../assets/audio/sfx/startup.wav';

export type SoundName = 'click' | 'error' | 'startup';

const SOUND_SRC: Record<SoundName, string> = {
    click: clickSfx,
    error: errorSfx,
    startup: startupSfx,
};

export interface SoundContextValue {
    muted: boolean;
    setMuted: (muted: boolean) => void;
    playSound: (name: SoundName) => void;
}

const STORAGE_KEY = 'rahulos.soundMuted';

const loadMuted = (): boolean => {
    try {
        return window.localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
        return false;
    }
};

const SoundContext = createContext<SoundContextValue | null>(null);

export const SoundProvider: React.FC = ({ children }) => {
    const [muted, setMutedState] = useState<boolean>(loadMuted);
    // One cached Audio element per clip, reused across plays (cloned via
    // currentTime reset) so rapid clicks don't leak new Audio objects.
    const clips = useRef<Partial<Record<SoundName, HTMLAudioElement>>>({});

    const setMuted = useCallback((next: boolean) => {
        setMutedState(next);
        try {
            window.localStorage.setItem(STORAGE_KEY, String(next));
        } catch {
            // localStorage unavailable — keep in-memory.
        }
    }, []);

    const playSound = useCallback(
        (name: SoundName) => {
            if (muted) return;
            let audio = clips.current[name];
            if (!audio) {
                audio = new Audio(SOUND_SRC[name]);
                clips.current[name] = audio;
            }
            audio.currentTime = 0;
            // Browsers can reject play() (autoplay policy, iframe context)
            // — this is a cosmetic sound effect, not worth surfacing.
            audio.play().catch(() => {});
        },
        [muted]
    );

    return (
        <SoundContext.Provider value={{ muted, setMuted, playSound }}>
            {children}
        </SoundContext.Provider>
    );
};

export function useSound(): SoundContextValue {
    const ctx = useContext(SoundContext);
    if (!ctx) {
        throw new Error('useSound must be used within a SoundProvider');
    }
    return ctx;
}
