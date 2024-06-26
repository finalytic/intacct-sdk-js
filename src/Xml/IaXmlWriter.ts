/**
 * @module Intacct/SDK/Xml
 */

/**
 * Copyright 2022 Sage Intacct, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"). You may not
 * use this file except in compliance with the License. You may obtain a copy
 * of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "LICENSE" file accompanying this file. This file is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

import * as dateFormat from "dateformat";
import {XMLBuilder} from "fast-xml-parser";

type Writer = ReturnType<typeof createWriter>
const createWriter = (xmlbuilder: XMLBuilder, root: any = {}, current: any = root, parent = root) => {
   const builder = {
        element: (name: string, value?: string, attributes?: any) => {
            current[name] = {
                '@attributes': attributes||{},
            };
            if (value) current[name]['#text'] = value;
            return createWriter(xmlbuilder, root, current[name], builder);
        },
        attribute: (name: string, value: any) => {
            console.log('ADD ATTRIB', current, name, value)
            current['@attributes'][name] = value;
            return builder;
        },
        up: () => {
            return parent;
        },
        doc: () => {
            return {
                end: (args: any) => {
                    return `<?xml version="1.0" encoding="UTF-8" ?>\n${xmlbuilder.build(root)}`
                },
            }
        }
   }
   return builder;
}

export default class IaXmlWriter {

    public static readonly intacctDateFormat = "mm/dd/yyyy";

    public static readonly intacctDateTimeFormat = "mm/dd/yyyy HH:MM:ss";

    public static readonly intacctMultiSelectGlue = "#~#";
    private _writer: Writer;

    constructor(private readonly tagname: string, private readonly attributes: object) {
        this._writer = createWriter(new XMLBuilder({
            attributesGroupName: '@attributes',
            // format: true,
            ignoreAttributes: false,
        }));
        this._writer = this._writer.element(tagname, undefined)
    }

    public flush(pretty = false): string {
        if (pretty === true) {
            return this._writer.doc().end({});
        } else {
            return this._writer.doc().end({});
        }
    }

    public writeStartElement(localName: string): void {
        this._writer = this._writer.element(localName);
    }

    public writeEndElement(): void {
        this._writer = this._writer.up();
    }

    public writeElement(localName: string, value: any, writeNull?: boolean): void {
        if (writeNull === null) {
            writeNull = false;
        }

        if (typeof value === "string") {
            if (value === null) {
                if (writeNull === true) {
                    this._writer.element(localName, value).up();
                }
            } else {
                // if value == "" we are writing it
                this._writer.element(localName, value).up();
            }
        } else if (typeof value === "number") {
            if (value === null) {
                if (writeNull === true) {
                    this._writer.element(localName, "").up();
                }
            } else {
                this._writer.element(localName, value.toString()).up();
            }
        } else if (typeof value === "boolean") {
            if (value === true) {
                this._writer.element(localName, "true").up();
            } else if (value === false) {
                this._writer.element(localName, "false").up();
            } else {
                if (writeNull === true) {
                    this._writer.element(localName, "").up();
                }
            }
        } else if (value instanceof Date) {
            if (value === null) {
                if (writeNull === true) {
                    this._writer.element(localName, "").up();
                }
            } else {
                this._writer.element(localName, dateFormat(value, IaXmlWriter.intacctDateTimeFormat)).up();
            }
        } else {
            if (value == null) {
                if (writeNull === true) {
                    this._writer.element(localName, "").up();
                }
            } else {
                this._writer.element(localName, "").up();
            }
        }
    }

    public writeElementDate(localName: string, value: Date, format?: string, writeNull?: boolean): void {
        if (format === null) {
            format = IaXmlWriter.intacctDateFormat;
        }
        if (writeNull === null) {
            writeNull = false;
        }

        if (value == null) {
            if (writeNull === true) {
                this._writer.element(localName, "").up();
            }
        } else {
            const date = dateFormat(value, format);
            this._writer.element(localName, date).up();
        }
    }

    public writeAttribute(localName: string, value: any, writeNull?: boolean) {
        if (writeNull === null) {
            writeNull = false;
        }

        if (typeof value === "string") {
            if (value !== null || writeNull === true) {
                this._writer.attribute(localName, value);
            }
        } else if (typeof value === "number") {
            if (value === null) {
                if (writeNull === true) {
                    this._writer.attribute(localName, "");
                }
            } else {
                this._writer.attribute(localName, value.toString());
            }
        } else if (typeof value === "boolean") {
            if (value === true) {
                this._writer.attribute(localName, "true");
            } else if (value === false) {
                this._writer.attribute(localName, "false");
            } else {
                if (writeNull === true) {
                    this._writer.attribute(localName, "");
                }
            }
        }
    }

    public writeDateSplitElements(date: Date, writeNull?: boolean) {
        if (writeNull === null) {
            writeNull = true;
        }

        this.writeElement("year", dateFormat(date, "yyyy"), writeNull);
        this.writeElement("month", dateFormat(date, "mm"), writeNull);
        this.writeElement("day", dateFormat(date, "dd"), writeNull);
    }

    public writeCustomFieldsExplicit(customFields: Array<[string, any]>) {
        if (customFields != null && customFields.length > 0) {
            this.writeStartElement("customfields");
            for (const customFieldId in customFields) {
                if (customFields[customFieldId]) {
                    this.writeStartElement("customfield");
                    this.writeElement("customfieldname", customFields[customFieldId][0], true);
                    this.writeElement("customfieldvalue", customFields[customFieldId][1], true);
                    this.writeEndElement(); // customfield
                }
            }
            this.writeEndElement(); // customfields
        }
    }

    public writeCustomFieldsImplicit(customFields: Array<[string, any]>) {
        if (customFields != null && customFields.length > 0) {
            for (const customFieldId in customFields) {
                if (customFields[customFieldId]) {
                    this.writeElement(customFields[customFieldId][0], customFields[customFieldId][1], true);
                }
            }
        }
    }
}
