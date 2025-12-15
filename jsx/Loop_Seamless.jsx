// Bắt đầu nhóm Undo
app.beginUndoGroup("Loop");

var comp = app.project.activeItem;

if (!(comp && comp instanceof CompItem)) {
    alert("Vui lòng mở một Composition trước khi chạy script.");
} else {
    var layers = comp.selectedLayers;

    if (layers.length !== 1) {
        alert(layers.length === 0 ? "Vui lòng chọn một layer trong timeline." : "Vui lòng chỉ chọn MỘT layer.");
    } else {
        var compA = layers[0];
        var trim = 2; // Thời gian cắt cố định (2 giây)

        // --- ScriptUI: slider chọn duration ---
        var win = new Window("dialog", "Chọn độ dài Comp B");
        win.orientation = "column";
        win.alignChildren = ["fill", "top"];

        win.add("statictext", undefined, "Chọn độ dài Comp B (giây):");

        var sliderGroup = win.add("group");
        sliderGroup.orientation = "row";
        sliderGroup.add("statictext", undefined, "6");
        var slider = sliderGroup.add("slider", undefined, 12, 6, 60); // default 12, min 6, max 60
        slider.preferredSize.width = 300;
        sliderGroup.add("statictext", undefined, "60");

        var valueText = win.add("statictext", undefined, "12 s"); // hiển thị giá trị slider
        slider.onChanging = function() {
            valueText.text = Math.round(slider.value) + " s";
        }

        var btnGroup = win.add("group");
        btnGroup.orientation = "row";
        var okBtn = btnGroup.add("button", undefined, "OK");
        btnGroup.add("button", undefined, "Cancel");

        if (win.show() == 1) { // OK
            var duration = Math.round(slider.value);

            // --- 1. Cắt 2s đầu & di chuyển Comp A lên 0s ---
            compA.inPoint += trim;
            compA.startTime = -compA.inPoint;

            // --- 2. Nhân đôi Layer A (Comp B) ---
            var compB = compA.duplicate();
            compB.name = compA.name + "_Copy";

            // --- 3. Đặt Comp B xuống (duration - trim) ---
            compB.startTime = (duration - trim) - compB.inPoint;

            // --- 4. Mở rộng 2s đã cắt ở Comp B ---
            compB.inPoint -= trim;

            // --- 5. Tạo Fade In 2s đầu ---
            var opacityProp = compB.property("ADBE Transform Group").property("ADBE Opacity");
            opacityProp.setValueAtTime(compB.inPoint, 0);
            opacityProp.setValueAtTime(compB.inPoint + trim, 100);

            // --- 6. Chỉnh Work Area = duration ---
            comp.workAreaStart = 0;
            comp.workAreaDuration = duration;

            alert("Đã loop layer: " + compA.name + " với độ dài " + duration + "s");
        }
    }
}

// Kết thúc nhóm Undo
app.endUndoGroup();
