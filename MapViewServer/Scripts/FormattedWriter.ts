namespace SourceUtils {
    export class FormattedWriter {
        private indentation = "";
        private lines: string[] = [];

        clear(): void {
            this.lines = [];
        }

        private writeLine(value: string): void {
            this.lines.push(this.indentation + value);
        }

        beginBlock(label: string): void {
            this.writeLine(`+ ${label}`);
            this.indentation += "  ";
        }

        writeProperty(key: string, value: any): void {
            this.writeLine(`- ${key}: ${value}`);
        }

        endBlock(): void {
            this.indentation = this.indentation.substr(0, this.indentation.length - 2);
        }

        getValue(): string {
            return this.lines.join("\r\n");
        }
    }

    export interface IStateLoggable {
        logState(writer: FormattedWriter): void;
    }
}
