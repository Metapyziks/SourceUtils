/// <reference path="Loader.ts"/>

namespace SourceUtils
{
    export class HardwareVertsLoader extends Loader<HardwareVerts> {
        constructor() {
            super();
        }

        protected onCreateItem(url: string): HardwareVerts {
            return new HardwareVerts(url);
        }
    }
}
