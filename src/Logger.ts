export type Logger = {
    log: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    info: (...args: any[]) => void;
}