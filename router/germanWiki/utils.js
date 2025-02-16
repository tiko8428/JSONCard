function removeReference(str) {
    if (!str) { str = this; }
    return str.replace(/\[(.*?)\]/g, "").replace(/☆/g, "").replace(/→\s[a-z]+/g, "").trim()
};

function newLineSplit(str) {
    if (!str) { str = this; }
    return str.split("\n").filter((w) => w);
};

function insideBracket(str) {
    if (!str) { str = this; }
    return str.match(/(?<=\[).+?(?=\])/g);
}

function toList(str) {
    if (!str) { str = this; }
    return str.newLineSplit().map((w) => w.removeReference()).join(",").split(",").map((w) => (w.trim()))
}

String.prototype.removeReference = removeReference;
String.prototype.newLineSplit = newLineSplit;
String.prototype.insideBracket = insideBracket;
String.prototype.toList = toList;


exports.module = { removeReference, newLineSplit, insideBracket, toList };