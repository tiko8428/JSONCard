require('./utils');

const {languageCodes} = require("./constants");

const extractWordHyphenation = ($) => {
    const TITLE = "Worttrennung";
    return { [TITLE]: $('[title="Trennungsmöglichkeiten am Zeilenumbruch"]+dl').text() };
}

const extractIPA = ($) => {
    const TITLE = "Aussprache";
    const ipa = $('[title="Phonetik"]+dl').text().newLineSplit().filter((s) => (s.includes("IPA")))[0];
    return { [TITLE]: ipa.replace("IPA:", "").trim() };

}

const extractOrigin = ($) => {
    const TITLE = "Herkunft";
    return { [TITLE]: $('[title="Etymologie und Morphologie"]+dl').text().removeReference() };

}

const extractMeanings = ($) => {
    const TITLE = "Bedeutungen";
    return {
        [TITLE]: $('[title="Sinn und Bezeichnetes (Semantik)"]+dl')
            .text()
            .newLineSplit()
            .map((w) => w.removeReference())
    };
}


const extractSynonym = ($) => {
    const TITLE = "Synonyme";
    const content = $('[title="bedeutungsgleich gebrauchte Wörter"]+dl')
        .text()

    return content ? {
        [TITLE]: content.toList()
    } : {[TITLE]: []};
}

const extractColor = (cell) => {
    let bgcolor;
    if (cell.attr().style) {
        bgcolor = cell.attr().style.substring(11).toUpperCase()
    } else {
        bgcolor = cell.attr().bgcolor
    }
    return bgcolor;
}

const headerColors = ["#F4F4F4", "#DEDEDE", "#C1C1C1"];

const extractAntonym = ($) => {
    const TITLE = "Gegenwörter";
    const content = $('[title="Antonyme"]+dl')
        .text()

    return content ?  {
        [TITLE]: content.toList()
    } : {[TITLE]: []};
}

const extractExamples = ($) => {
    const TITLE = "Beispiele";
    return {
        [TITLE]: $('[title="Verwendungsbeispielsätze"]+dl')
            .text()
            .newLineSplit()
            .map((w) => w.removeReference())
    };
}


const extractIdiom = ($) => {
    const TITLE = "Redewendungen";
    return {
        [TITLE]: $('[title="Phraseologismen"]+dl')
            .text()
            .newLineSplit()
            .map((w) => w.removeReference())
    };
}

const extractWordCombinations = ($) => {
    const TITLE = "Charakteristische Wortkombinationen";
    return {
        [TITLE]: $('[title="Signifikante Kollokationen"]+dl')
            .text()
            .newLineSplit()
            .map((w) => w.removeReference())
    };
}

const extractTranslations = ($) => {
    const TITLE = "Übersetzungen";

    const translations = $('table[title="Übersetzungen in andere Sprachen"] ul')
        .text()
        .newLineSplit()
        .map((w) => {
            const [lang, word] = w.split(":")
            const languageCode = languageCodes[lang.trim()]
            return { language: lang.trim(), languageCode: languageCode, translation: word.removeReference() }
        });


    return {
        [TITLE]: translations
    };
}
const extractInfinitives = ($, row) => {
    const headers = ["", "Infinitiv Präsens", "Infinitiv Perfekt"];
    const rowHeaders = { "Aktiv": true, "Vorgangspassiv": true, "Zustandspassiv": true };

    const r = {};
    let currentRowHeader = ""
    $(row).find('td,th').each((cellIndex, c) => {
        const cell = $(c);
        const text = cell.text().trim()
        const bgcolor = extractColor(cell)
        if (headerColors.includes(bgcolor)) {
            currentRowHeader = text;
            r[currentRowHeader] = {};

        }
        else if (!bgcolor) {
            if (rowHeaders[currentRowHeader])
                r[currentRowHeader] = { ...r[currentRowHeader], [headers[cellIndex]]: text };
        }

    });
    return { ...r };

}


const extractImperatives = ($, row) => {
    const headers = ["", "Präsens Aktiv", "Präsens Vorgangspassiv", "Präsens Zustandspassiv", "Perfekt Aktiv", "Perfekt Vorgangspassiv", "Perfekt Zustandspassiv"];
    const rowHeaders = { "2. Person Singular": true, "2. Person Plural": true, "Höflichkeitsform": true };
    const r = {};
    let currentRowHeader = ""
    $(row).find('td,th').each((cellIndex, c) => {
        const cell = $(c);
        const text = cell.text().trim()
        const bgcolor = extractColor(cell)
        if (headerColors.includes(bgcolor)) {
            currentRowHeader = text;
            r[currentRowHeader] = {};

        }
        else if (!bgcolor) {
            if (rowHeaders[currentRowHeader])
                r[currentRowHeader] = { ...r[currentRowHeader], [headers[cellIndex]]: text };
        }

    });
    return { ...r };

};

const extractPresent = ($, row) => {
    const headers = ["", "Aktiv Indikativ", "Aktiv Konjunktiv I", "Vorgangspassiv Indikativ", "Vorgangspassiv Konjunktiv I", "Zustandspassiv Indikativ", "Zustandspassiv Konjunktiv I"];
    const rowHeaders = {
        "1. Person Singular": true,
        "2. Person Singular": true,
        "3. Person Singular": true,
        "1. Person Plural": true,
        "2. Person Plural": true,
        "3. Person Plural": true
    };
    const r = {};
    let currentRowHeader = ""
    $(row).find('td,th').each((cellIndex, c) => {
        const cell = $(c);
        const text = cell.text().trim()
        const bgcolor = extractColor(cell)
        if (headerColors.includes(bgcolor)) {
            currentRowHeader = text;
            r[currentRowHeader] = {};

        }
        else if (!bgcolor) {
            if (rowHeaders[currentRowHeader])
                r[currentRowHeader] = { ...r[currentRowHeader], [headers[cellIndex]]: text };
        }

    });
    return { ...r };

};

const extractPast = ($, row) => {
    const headers = ["", "Aktiv Indikativ", "Aktiv Konjunktiv II", "Vorgangspassiv Indikativ", "Vorgangspassiv Konjunktiv II", "Zustandspassiv Indikativ", "Zustandspassiv Konjunktiv II"];
    const rowHeaders = {
        "1. Person Singular": true,
        "2. Person Singular": true,
        "3. Person Singular": true,
        "1. Person Plural": true,
        "2. Person Plural": true,
        "3. Person Plural": true
    };
    const r = {};
    let currentRowHeader = ""
    $(row).find('td,th').each((cellIndex, c) => {
        const cell = $(c);
        const text = cell.text().trim()
        const bgcolor = extractColor(cell)
        if (headerColors.includes(bgcolor)) {
            currentRowHeader = text;
            r[currentRowHeader] = {};

        }
        else if (!bgcolor) {
            if (rowHeaders[currentRowHeader])
                r[currentRowHeader] = { ...r[currentRowHeader], [headers[cellIndex]]: text };
        }

    });
    return { ...r };

};

const extractFuture = ($, row) => {
    const headers = ["", "Aktiv Indikativ", "Aktiv Konjunktiv I", "Aktiv Konjunktiv II", "Vorgangspassiv Indikativ", "Vorgangspassiv Konjunktiv I", "Vorgangspassiv Konjunktiv II", "Zustandspassiv Indikativ", "Zustandspassiv Konjunktiv I", "Zustandspassiv Konjunktiv II"];
    const rowHeaders = {
        "1. Person Singular": true,
        "2. Person Singular": true,
        "3. Person Singular": true,
        "1. Person Plural": true,
        "2. Person Plural": true,
        "3. Person Plural": true
    };
    const r = {};
    let currentRowHeader = ""
    $(row).find('td,th').each((cellIndex, c) => {
        const cell = $(c);
        const text = cell.text().trim()
        const bgcolor = extractColor(cell)
        if (headerColors.includes(bgcolor)) {
            currentRowHeader = text;
            r[currentRowHeader] = {};

        }
        else if (!bgcolor) {
            if (rowHeaders[currentRowHeader])
                r[currentRowHeader] = { ...r[currentRowHeader], [headers[cellIndex]]: text };
        }

    });
    return { ...r };

};


const extractParticiples = ($, row) => {
    const headers = ["Präsens Aktiv", "Perfekt Passiv", "Gerundivum"];
    const r = {};
    $(row).find('td,th').each((cellIndex, c) => {
        const cell = $(c);
        const text = cell.text().trim()
        r[headers[cellIndex]] = text;


    });
    return { ...r };

};

const extractInflectionOfVerbalAdjectives = ($, row) => {
    const headers = ["Präsens Aktiv", "Perfekt Passiv", "Gerundivum"];
    const r = {};
    $(row).find('td,th').each((cellIndex, c) => {
        const cell = $(c);
        const text = cell.text().replace("Flexion:", "").trim()
        r[headers[cellIndex]] = text;
    });
    return { ...r };
}

const ROW_ROLE = {
    HEADER: "header",
    TITLE: "title",
    MIXED: "mixed",
    SUBTITLE: "subtitle",
    DATA: "data"
}

const checkRowRole = ($, row) => {
    const areAllEqual = (array) => {
        const result = new Set(array).size === 1;

        return result;
    };

    const colors = [];
    $(row).find('td,th').each((_, c) => {
        let pushColor;
        if ($(c).attr().style) {
            pushColor = $(c).attr().style.substring(11).toUpperCase();
        } else {
            pushColor = $(c).attr().bgcolor
        }
        colors.push(pushColor);
    });
    if (areAllEqual(colors)) {
        if (colors[0] === "#CCCCFF") {
            if (colors.length > 1) {
                return ROW_ROLE.SUBTITLE;
            }
            return ROW_ROLE.TITLE;
        }
        else if (colors[0] === "#F4F4F4") {
            return ROW_ROLE.HEADER;
        }
        else {
            ROW_ROLE.DATA;
        }
    }
    if (colors[0] === "#E8E8E8"){
        return ROW_ROLE.HEADER;
    } else {
        return ROW_ROLE.MIXED;
    }

}

const inflectionHandlers = {
    "(nichterweiterte) Infinitive": extractInfinitives,
    "erweiterte Infinitive": extractInfinitives,
    "Partizipien": extractParticiples,
    "Flexion der Verbaladjektive": extractInflectionOfVerbalAdjectives,
    "Imperative": extractImperatives,
    "Präsens": extractPresent,
    "Präteritum": extractPast,
    "Perfekt": extractPresent,
    "Plusquamperfekt": extractPast,
    "Futur I": extractFuture,
    "Futur II": extractFuture

};
const extractVerbInflection = ($) => {
    let inflections = {}
    $("table").each((_, table) => {
        let inflection = "";
        let tableData = {};
        $(table).find('tr').each((_, row) => {
            let role;
            if ($(row).attr().style === 'background:#f4f4f4'){
                role = 'header'
            } else {
                role = checkRowRole($, row);
            }
            switch (role) {
                case ROW_ROLE.TITLE:
                    inflection = $(row).find('td,th').text().trim();
                    break;
                case ROW_ROLE.HEADER || ROW_ROLE.SUBTITLE:
                    break;
                case ROW_ROLE.MIXED || ROW_ROLE.DATA:
                    const extract = inflectionHandlers[inflection];
                    if (extract) {
                        const res = extract($, row);
                        tableData[inflection] = { ...tableData[inflection], ...res };
                    };
                    break;
            }
        });
        inflections = { ...inflections, ...tableData }
    });
    return inflections;
};

function addSeparation(str) {
    const match = str.match(/(des |die |der |dem |den |das )+/g);
    if (match && match.length === 2) {
        const firstPrefix = str.substring(0,4);
        const separationStart = str.indexOf(firstPrefix, 5);
        if (separationStart !== -1) {
            return str.slice(0,separationStart) + ', ' + str.slice(separationStart);
        }
    }
    return str;
}

const extractInflection = ($) => {
    const TITLE = "Flexion";
    const table = $('table.inflection-table').text();
    const res = {
        "Präsens": [],
        "Präteritum": [],
        "Konjunktiv II": [],
        "Imperativ": [],
        "Perfekt": [],
        "Nominativ": [],
        "Genitiv": [],
        "Dativ": [],
        "Akkusativ": []
    };
    let currentHeader = "";
    const headers = Object.keys(res);
    const inflectionList1 = [
        "Präsens",
        "Präteritum",
        "Konjunktiv II",
        "Imperativ",
        "Perfekt"];

    const inflectionList2 = [
        "Nominativ",
        "Genitiv",
        "Dativ",
        "Akkusativ"];

    const foundOnList = (h, list) => {
        for (const comp of list) {
            if (h.includes(comp)) {
                return true;
            }
        }
        return false;
    }

    table.split("\n\n\n").forEach((line) => {
        const unusedLine = line.includes("Alle weiteren Formen") || line.includes("Person") || line.includes("Wortform");
        if (line.length && !unusedLine) {
            const rows = line.newLineSplit();
            if (rows[0].includes('Konjunktiv')){
                currentHeader = rows[0];
                res['Konjunktiv II'].push({ Person: rows[1].trim(), Wortform: rows[2].trim() });
            }

            if (!foundOnList(line, headers)) {
                if (currentHeader.includes("Perfekt")) {
                    if (res[currentHeader]) res[currentHeader].push({ "Partizip II": rows[0].trim(), "Hilfsverb": rows[1].trim() });
                }
                else {
                    if (res[currentHeader]) res[currentHeader].push({ "Person": rows[0].trim(), "Wortform": rows[1].trim() });
                }
            }
            else {
                if (foundOnList(line, inflectionList1)) {
                    if (!line.includes("Perfekt")) {
                        currentHeader = rows[0];
                        if (res[currentHeader]) res[currentHeader].push({ Person: rows[1].trim(), Wortform: rows[2].trim() });
                    }
                    else {
                        currentHeader = "Perfekt";
                    }

                }
                else if (foundOnList(line, inflectionList2)) {
                    currentHeader = rows[0];
                    if (res[currentHeader]) res[currentHeader].push({ Singular: addSeparation(rows[1].trim()), Plural: rows[2].trim() });

                }

            }
        }
    });
    for (const [key, value] of Object.entries(res)) {
        if (value.length === 0) {
            res[key] = null
        }
    };
    return {
        [TITLE]: res
    };
}

module.exports = {
    extractWordHyphenation,
    extractIPA,
    extractOrigin,
    extractMeanings,
    extractSynonym,
    extractAntonym,
    extractExamples,
    extractIdiom,
    extractWordCombinations,
    extractTranslations,
    extractInflection,
    extractVerbInflection
};