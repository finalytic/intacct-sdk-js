import {expect, it} from 'bun:test';
import IaXmlWriter from '../src/Xml/IaXmlWriter';

it('works', () => {
    const xml = new IaXmlWriter('request', {
        "version": "1.0",
        "encoding": 'utf8',
        "standalone": null,
    });
    xml.writeElement("basecurr", 'cur');
    xml.writeElement("currency", 'tcur');
    xml.writeStartElement("exchratedate");
    xml.writeDateSplitElements(new Date());
    xml.writeEndElement();
    const result = xml.flush(true);
    console.log(result);
    expect(result).toBeTruthy();
});