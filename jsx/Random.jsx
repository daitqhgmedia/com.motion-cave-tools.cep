var comp = app.project.activeItem;
if (!comp || !(comp instanceof CompItem)) {
    alert("Hãy mở một composition trước.");
} else {
    var sel = comp.selectedLayers;
    if (sel.length === 0) {
        alert("Hãy chọn ít nhất một layer.");
    } else {

        // ===== MAIN UI =====
        var win = new Window("palette", "Layer Timing + Random Tool", undefined);
        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.spacing = 12;

        // ------------------- TIMING PANEL -------------------
        var timingPanel = win.add("panel", undefined, "Timing");
        timingPanel.orientation = "column";
        timingPanel.alignChildren = ["fill", "top"];

        var chkTiming = timingPanel.add("checkbox", undefined, "Enable Random In-Time");
        chkTiming.value = true;

        var modeDropdown = timingPanel.add("dropdownlist", undefined, [
            "1: Ngẫu nhiên âm thời gian (seed)",
            "2: So le x frame",
            "3: Tuần tự x frame (forward)",
            "4: Tuần tự x frame (reverse)"
        ]);
        modeDropdown.selection = 0;

        var seedGroup = timingPanel.add("group");
        seedGroup.add("statictext", undefined, "Seed / x frame offset:");
        var inputSeed = seedGroup.add("edittext", undefined, "10");
        inputSeed.characters = 8;


        // ------------------- RANDOM TRANSFORM -------------------
        var randPanel = win.add("panel", undefined, "Random Transform");
        randPanel.orientation = "column";
        randPanel.alignChildren = ["fill", "top"];
        randPanel.spacing = 6;

        // Scale
        var chkSize = randPanel.add("checkbox", undefined, "Random Scale");
        var sizePanel = randPanel.add("group");
        sizePanel.add("statictext", undefined, "Min:");
        var minSize = sizePanel.add("edittext", undefined, "10");
        minSize.characters = 6;
        sizePanel.add("statictext", undefined, "Max:");
        var maxSize = sizePanel.add("edittext", undefined, "100");
        maxSize.characters = 6;

        // Rotation
        var chkRot = randPanel.add("checkbox", undefined, "Random Rotation");
        var rotPanel = randPanel.add("group");
        rotPanel.add("statictext", undefined, "Min:");
        var minRot = rotPanel.add("edittext", undefined, "-30");
        minRot.characters = 6;
        rotPanel.add("statictext", undefined, "Max:");
        var maxRot = rotPanel.add("edittext", undefined, "30");
        maxRot.characters = 6;

        // Position
        var chkPos = randPanel.add("checkbox", undefined, "Random Position (full composition spread)");


        // ------------------- BUTTONS -------------------
        var btnGroup = win.add("group");
        btnGroup.orientation = "row";
        btnGroup.alignment = "center";
        var resetBtn = btnGroup.add("button", undefined, "Reset");
        var applyBtn = btnGroup.add("button", undefined, "Apply");


        // ======================================================
        // APPLY FUNCTION
        // ======================================================
        function applyTools() {
            app.beginUndoGroup("Layer Timing + Random");

            var mode = modeDropdown.selection.index + 1;
            var value = parseFloat(inputSeed.text);
            var frameRate = comp.frameRate;

            // ---- TIMING ----
            if (chkTiming.value) {
                if (mode === 1) {
                    for (var i = 0; i < sel.length; i++)
                        sel[i].startTime -= Math.random() * value;
                }
                else if (mode === 2) {
                    var x = value / frameRate;
                    for (var j = 0; j < sel.length; j++)
                        if (j % 2 === 1) sel[j].startTime -= x;
                }
                else if (mode === 3 || mode === 4) {
                    var x = value / frameRate;
                    var reverse = (mode === 4);
                    for (var k = 0; k < sel.length; k++) {
                        var index = reverse ? sel.length - 1 - k : k;
                        sel[index].startTime = sel[0].startTime + k * x;
                    }
                }
            }

            // ---- RANDOM TRANSFORM----
            var minS = parseFloat(minSize.text), maxS = parseFloat(maxSize.text);
            var minR = parseFloat(minRot.text), maxR = parseFloat(maxRot.text);

            for (var i = 0; i < sel.length; i++) {
                var L = sel[i];

                if (chkSize.value) {
                    var s = Math.random() * (maxS - minS) + minS;
                    L.property("Scale").setValue([s, s]);
                }
                if (chkRot.value && L.property("Rotation")) {
                    var r = Math.random() * (maxR - minR) + minR;
                    L.property("Rotation").setValue(r);
                }
                if (chkPos.value) {
                    var px = Math.random() * comp.width;
                    var py = Math.random() * comp.height;
                    L.property("Position").setValue([px, py]);
                }
            }

            app.endUndoGroup();
        }


        // ======================================================
        // RESET FUNCTION
        // ======================================================
        function resetSelected() {
            app.beginUndoGroup("Reset Selected");

            for (var i = 0; i < sel.length; i++) {
                var L = sel[i];

                if (chkTiming.value)          L.startTime = 0;
                if (chkSize.value)            L.property("Scale").setValue([100, 100]);
                if (chkRot.value && L.property("Rotation")) L.property("Rotation").setValue(0);
                if (chkPos.value)             L.property("Position").setValue([comp.width/2, comp.height/2]);
            }

            app.endUndoGroup();
        }


        // --- Button Events ---
        applyBtn.onClick = applyTools;
        resetBtn.onClick = resetSelected;

        win.center();
        win.show();
    }
}
