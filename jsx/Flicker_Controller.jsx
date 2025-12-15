{
    app.beginUndoGroup("Create Flicker Adjustment Layer");

    var comp = app.project.activeItem;

    if (comp != null && comp instanceof CompItem) {

        // 1. Tạo Adjustment Layer
        var adjLayer = comp.layers.addSolid([0,0,0], "Flicker Controller", comp.width, comp.height, comp.pixelAspect);
        adjLayer.adjustmentLayer = true;
        adjLayer.moveToBeginning();      // Đưa lên trên cùng (Top)
        
        // --- Slider 1: Amplitude (Biên độ) ---
        var ampSlider = adjLayer.property("Effects").addProperty("ADBE Slider Control");
        ampSlider.name = "Flicker Amp";
        ampSlider.property("Slider").setValue(12);

        // --- Slider 2: Speed (Tốc độ) ---
        var spdSlider = adjLayer.property("Effects").addProperty("ADBE Slider Control");
        spdSlider.name = "Flicker Speed";
        spdSlider.property("Slider").setValue(2); 

        // --- Slider 3: Base (Độ sáng cơ bản) ---
        var baseSlider = adjLayer.property("Effects").addProperty("ADBE Slider Control");
        baseSlider.name = "Base Brightness";
        baseSlider.property("Slider").setValue(5);

        // 3. Thêm hiệu ứng Brightness & Contrast
        var bncEffect = adjLayer.property("Effects").addProperty("ADBE Brightness & Contrast 2");

        // Lưu ý: Tên trong expression phải khớp với tên Slider đã đặt
        var expressionString = 
            'amp = effect("Flicker Amp")("Slider");\n' +
            'spd = effect("Flicker Speed")("Slider");\n' +
            'base = effect("Base Brightness")("Slider");\n' +
            'flick = noise(time * spd) * amp;\n' +
            'base + flick;';

        // Áp dụng Expression vào thuộc tính Brightness (Index 1)
        bncEffect.property(1).expression = expressionString;

    } else {
        alert("Vui lòng chọn hoặc mở một Composition trước khi chạy script.");
    }

    app.endUndoGroup();
}