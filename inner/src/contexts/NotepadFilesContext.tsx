import React, {
    createContext,
    useCallback,
    useContext,
    useState,
} from 'react';

export interface NotepadFile {
    name: string;
    content: string;
    modified: number;
}

export interface NotepadFilesContextValue {
    files: NotepadFile[];
    getFile: (name: string) => NotepadFile | undefined;
    saveFile: (name: string, content: string) => void;
    deleteFile: (name: string) => void;
}

const STORAGE_KEY = 'rahulos.notepadFiles';

type StoredFiles = Record<string, { content: string; modified: number }>;

const loadFiles = (): StoredFiles => {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return {};
        const result: StoredFiles = {};
        Object.entries(parsed).forEach(([name, value]) => {
            if (
                value &&
                typeof (value as any).content === 'string' &&
                typeof (value as any).modified === 'number'
            ) {
                result[name] = value as StoredFiles[string];
            }
        });
        return result;
    } catch {
        return {};
    }
};

const persist = (files: StoredFiles) => {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
    } catch {
        // localStorage unavailable (private mode / iframe) — keep in-memory.
    }
};

const NotepadFilesContext = createContext<NotepadFilesContextValue | null>(
    null
);

export const NotepadFilesProvider: React.FC = ({ children }) => {
    const [stored, setStored] = useState<StoredFiles>(loadFiles);

    const getFile = useCallback(
        (name: string): NotepadFile | undefined => {
            const entry = stored[name];
            if (!entry) return undefined;
            return { name, content: entry.content, modified: entry.modified };
        },
        [stored]
    );

    const saveFile = useCallback((name: string, content: string) => {
        setStored((prev) => {
            const next = {
                ...prev,
                [name]: { content, modified: Date.now() },
            };
            persist(next);
            return next;
        });
    }, []);

    const deleteFile = useCallback((name: string) => {
        setStored((prev) => {
            if (!(name in prev)) return prev;
            const next = { ...prev };
            delete next[name];
            persist(next);
            return next;
        });
    }, []);

    const files: NotepadFile[] = Object.entries(stored).map(
        ([name, entry]) => ({
            name,
            content: entry.content,
            modified: entry.modified,
        })
    );

    return (
        <NotepadFilesContext.Provider
            value={{ files, getFile, saveFile, deleteFile }}
        >
            {children}
        </NotepadFilesContext.Provider>
    );
};

export function useNotepadFiles(): NotepadFilesContextValue {
    const ctx = useContext(NotepadFilesContext);
    if (!ctx) {
        throw new Error(
            'useNotepadFiles must be used within a NotepadFilesProvider'
        );
    }
    return ctx;
}
