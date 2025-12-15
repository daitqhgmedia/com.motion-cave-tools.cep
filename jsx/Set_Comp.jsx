var comp = app.project.activeItem;
if (!comp || !(comp instanceof CompItem)) {
    alert("Hãy mở một composition trước.");
} else {

    // ===== ScriptUI Panel =====
    var win = new Window("palette", "Comp Settings Tool", undefined);
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.spacing = 10;
    win.margins = 16;

    function secToMinSec(sec) {
        var m = Math.floor(sec / 60);
        var s = Math.round(sec % 60);
        return m + ":" + (s < 10 ? "0" + s : s);
    }

    // ===== Resolution checkboxes (3 options) =====
    win.add("statictext", undefined, "Chọn độ phân giải:");
    var resGroup = win.add("group");
    resGroup.orientation = "row";
    resGroup.spacing = 10;

    var currentResStr = comp.width + "x" + comp.height;

    var resCurrent = resGroup.add("checkbox", undefined, currentResStr);
    var res4k = resGroup.add("checkbox", undefined, "3840x2160");
    var resHD = resGroup.add("checkbox", undefined, "1920x1080");

    // Auto-checked resolution hiện tại
    resCurrent.value = true;
    res4k.value = false;
    resHD.value = false;

    function uniqueResolution(chk) {
        if (chk.value) {
            if (chk !== resCurrent) resCurrent.value = false;
            if (chk !== res4k) res4k.value = false;
            if (chk !== resHD) resHD.value = false;
        } else {
            chk.value = true;
        }
    }

    resCurrent.onClick = function() { uniqueResolution(resCurrent); };
    res4k.onClick = function() { uniqueResolution(res4k); };
    resHD.onClick = function() { uniqueResolution(resHD); };

    // ===== FPS checkboxes (unique) =====
    win.add("statictext", undefined, "Chọn FPS:");
    var fpsGroup = win.add("group");
    fpsGroup.orientation = "row";
    fpsGroup.spacing = 10;

    var fps30 = fpsGroup.add("checkbox", undefined, "30");
    var fps60 = fpsGroup.add("checkbox", undefined, "60");

    // Mặc định theo FPS hiện tại của comp
    if (comp.frameRate === 30) {
        fps30.value = true; fps60.value = false;
    } else if (comp.frameRate === 60) {
        fps60.value = true; fps30.value = false;
    } else {
        fps30.value = true; fps60.value = false;
    }

    function uniqueFPS(chk) {
        if (chk.value) {
            if (chk !== fps30) fps30.value = false;
            if (chk !== fps60) fps60.value = false;
        } else {
            chk.value = true;
        }
    }

    fps30.onClick = function() { uniqueFPS(fps30); };
    fps60.onClick = function() { uniqueFPS(fps60); };

    // ===== Duration slider (fixed 26s) =====
    win.add("statictext", undefined, "Chọn thời lượng (s):");
    var durationGroup = win.add("group");
    durationGroup.orientation = "row";
    durationGroup.alignChildren = ["fill", "center"];
    var durationSlider = durationGroup.add("slider", undefined, 26, 1, 600);
    durationSlider.preferredSize.width = 180;
    var durationValue = durationGroup.add("edittext", undefined, "26");
    durationValue.characters = 5;
    var durationMinSec = durationGroup.add("statictext", undefined, secToMinSec(26));

    durationSlider.onChanging = function() {
        var val = Math.round(durationSlider.value);
        durationValue.text = val;
        durationMinSec.text = secToMinSec(val);
    };
    durationValue.onChange = function() {
        var val = parseFloat(durationValue.text);
        if (!isNaN(val)) {
            val = Math.max(1, Math.min(600, val));
            durationSlider.value = val;
            durationValue.text = val;
            durationMinSec.text = secToMinSec(val);
        } else {
            durationValue.text = Math.round(durationSlider.value);
            durationMinSec.text = secToMinSec(durationSlider.value);
        }
    };

    // ===== Work Area slider (default 3s) =====
    win.add("statictext", undefined, "Chọn Work Area (s):");
    var workGroup = win.add("group");
    workGroup.orientation = "row";
    workGroup.alignChildren = ["fill", "center"];
    var workSlider = workGroup.add("slider", undefined, 3, 1, 600);
    workSlider.preferredSize.width = 180;
    var workValue = workGroup.add("edittext", undefined, "3");
    workValue.characters = 5;
    var workMinSec = workGroup.add("statictext", undefined, secToMinSec(3));

    workSlider.onChanging = function() {
        var val = Math.round(workSlider.value);
        workValue.text = val;
        workMinSec.text = secToMinSec(val);
    };
    workValue.onChange = function() {
        var val = parseFloat(workValue.text);
        if (!isNaN(val)) {
            val = Math.max(1, Math.min(600, val));
            workSlider.value = val;
            workValue.text = val;
            workMinSec.text = secToMinSec(val);
        } else {
            workValue.text = Math.round(workSlider.value);
            workMinSec.text = secToMinSec(workSlider.value);
        }
    };

    // ===== Buttons =====
    var btnGroup = win.add("group");
    btnGroup.orientation = "row";
    btnGroup.spacing = 10;
    var resetBtn = btnGroup.add("button", undefined, "Reset");
    var applyBtn = btnGroup.add("button", undefined, "Apply");
    applyBtn.active = true;

    function applySettings() {
        app.beginUndoGroup("Set Comp Settings");

        // Resolution
        if (resCurrent.value) {
            // giữ nguyên
        } else if (res4k.value) {
            comp.width = 3840;
            comp.height = 2160;
        } else if (resHD.value) {
            comp.width = 1920;
            comp.height = 1080;
        }

        // FPS
        comp.frameRate = fps30.value ? 30 : 60;

        // Duration (fixed 26s)
        comp.duration = 26;

        // Work Area
        comp.workAreaStart = 0;
        comp.workAreaDuration = workSlider.value;

        app.endUndoGroup();

        alert("Comp và Work Area đã cập nhật!\n" +
              "Resolution: " + comp.width + "x" + comp.height + "\n" +
              "FPS: " + comp.frameRate + "\n" +
              "Duration: 0:26 (26s)" +
              "\nWork Area: " + secToMinSec(comp.workAreaDuration) + " (" + comp.workAreaDuration + "s)");
    }

    applyBtn.onClick = applySettings;

    resetBtn.onClick = function() {
        // Reset về resolution hiện tại, FPS 30, duration 26s, work area 3s
        resCurrent.value = true; res4k.value = false; resHD.value = false;
        fps30.value = true; fps60.value = false;
        durationSlider.value = 26; durationValue.text = "26"; durationMinSec.text = secToMinSec(26);
        workSlider.value = 3; workValue.text = "3"; workMinSec.text = secToMinSec(3);
    };

    win.center();
    win.show();
}
