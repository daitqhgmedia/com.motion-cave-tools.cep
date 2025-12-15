(function () {
    app.beginUndoGroup("DUMP ALL EFFECT PROPERTIES (READABLE)");

    var comp = app.project.activeItem;
    if (!(comp && comp instanceof CompItem)) {
        alert("OPEN A COMP FIRST.");
        return;
    }
    if (comp.selectedLayers.length === 0) {
        alert("SELECT AT LEAST ONE LAYER.");
        return;
    }

    var layer = comp.selectedLayers[0];
    var fxParade = layer.property("ADBE Effect Parade");

    if (!fxParade || fxParade.numProperties === 0) {
        alert("LAYER HAS NO EFFECTS.");
        return;
    }

    var lines = [];
    var SEP = "------------------------------------------------------------";

    lines.push("AE EFFECT PROPERTY EXPLORER");
    lines.push("Layer : " + layer.name);
    lines.push(SEP);
    lines.push("");

    // ---------- VALUE TYPE LABEL ----------
    function valTypeLabel(v) {
        var m = {};
        m[PropertyValueType.NO_VALUE] = "NO_VALUE";
        m[PropertyValueType.OneD] = "1D";
        m[PropertyValueType.TwoD] = "2D";
        m[PropertyValueType.TwoD_SPATIAL] = "2D_SPATIAL";
        m[PropertyValueType.ThreeD] = "3D";
        m[PropertyValueType.ThreeD_SPATIAL] = "3D_SPATIAL";
        m[PropertyValueType.COLOR] = "COLOR";
        m[PropertyValueType.CUSTOM_VALUE] = "CUSTOM";
        m[PropertyValueType.MARKER] = "MARKER";
        m[PropertyValueType.LAYER_INDEX] = "LAYER_INDEX";
        m[PropertyValueType.MASK_INDEX] = "MASK_INDEX";
        m[PropertyValueType.SHAPE] = "SHAPE";
        m[PropertyValueType.TEXT_DOCUMENT] = "TEXT";
        return m[v] || String(v);
    }

    function safeValue(p) {
        try {
            if (
                p.propertyType === PropertyType.PROPERTY &&
                p.propertyValueType !== PropertyValueType.NO_VALUE
            ) {
                return p.value;
            }
        } catch (e) {}
        return "(unreadable)";
    }

    function valToString(v) {
        if (v === null || v === undefined) return "";
        if (v instanceof Array) return "[" + v.join(", ") + "]";
        if (typeof v === "object") return "[object]";
        return String(v);
    }

    // ---------- RECURSIVE DUMP ----------
    function dumpGroup(group, indent, pathExpr) {
        for (var i = 1; i <= group.numProperties; i++) {
            var p = group.property(i);
            var isProp = p.propertyType === PropertyType.PROPERTY;
            var currentPath = pathExpr + ".property(" + i + ")";

            if (!isProp) {
                // GROUP
                lines.push(indent + "[GROUP] " + p.name);
                lines.push(indent + "  matchName : " + p.matchName);
                lines.push(indent + "  index     : " + i);
                lines.push(indent + "  path      : " + currentPath);
                lines.push("");

                dumpGroup(p, indent + "  ", currentPath);
            } else {
                // PROPERTY
                lines.push(indent + "[PROP] " + p.name);
                lines.push(indent + "  matchName : " + p.matchName);
                lines.push(indent + "  index     : " + i);
                lines.push(
                    indent +
                        "  valType   : " +
                        valTypeLabel(p.propertyValueType)
                );
                lines.push(
                    indent +
                        "  value     : " +
                        valToString(safeValue(p))
                );
                lines.push(indent + "  path      : " + currentPath);
                lines.push("");
            }
        }
    }

    // ---------- DUMP ALL EFFECTS ----------
    for (var e = 1; e <= fxParade.numProperties; e++) {
        var eff = fxParade.property(e);
        var effPath =
            'layer.property("ADBE Effect Parade").property("' +
            eff.matchName +
            '")';

        lines.push(SEP);
        lines.push("[EFFECT " + e + "] " + eff.name);
        lines.push("matchName : " + eff.matchName);
        lines.push("path      : " + effPath);
        lines.push("");

        dumpGroup(eff, "  ", effPath);
    }

    // ---------- UI ----------
    var w = new Window("dialog", "AE Effect Property Explorer");
    var edit = w.add("edittext", undefined, lines.join("\n"), {
        multiline: true,
        scrolling: true
    });
    edit.preferredSize = [1050, 650];
    w.add("button", undefined, "OK");
    w.show();

    app.endUndoGroup();
})();
