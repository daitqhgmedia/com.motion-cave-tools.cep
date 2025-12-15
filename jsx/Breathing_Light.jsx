{
    app.beginUndoGroup("Create Breathing Light Layer");

    var comp = app.project.activeItem;

    if (comp != null && comp instanceof CompItem) {

        // --- Cấu hình thời gian và giá trị --- Hello khoa
        var t1 = 0;  
        var t2 = 3;  
        var vMin = -10; 
        var vMax = 10;  

        // 1. Tạo Adjustment Layer
        var adjLayer = comp.layers.addSolid([0,0,0], "Breathing Light Controller", comp.width, comp.height, comp.pixelAspect);
        adjLayer.adjustmentLayer = true;
        adjLayer.moveToBeginning();

        // 2. Tạo Controller Sliders
        var fxSection = adjLayer.property("Effects");

        // Slider: Min Brightness
        var minSlider = fxSection.addProperty("ADBE Slider Control");
        minSlider.name = "Min Brightness";
        minSlider.property("Slider").setValue(vMin); 

        // Slider: Max Brightness 
        var maxSlider = fxSection.addProperty("ADBE Slider Control");
        maxSlider.name = "Max Brightness";
        maxSlider.property("Slider").setValue(vMax); 

        // 3. Thêm hiệu ứng Brightness & Contrast
        var bncEffect = fxSection.addProperty("ADBE Brightness & Contrast 2");
        bncEffect.name = "Breathing Light Controller";
        var brightProp = bncEffect.property("ADBE Brightness & Contrast 2-0001");

        // 4. Tạo Keyframes
        brightProp.setValueAtTime(t1, vMin);
        brightProp.setValueAtTime(t2, vMax);

        // 5. Easy Ease (F9)
        var easeIn = new KeyframeEase(0, 33.33);
        var easeOut = new KeyframeEase(0, 33.33);
        
        brightProp.setTemporalEaseAtKey(1, [easeIn], [easeOut]);
        brightProp.setTemporalEaseAtKey(2, [easeIn], [easeOut]);

        // 6. Expression Loop & Control
        var expr = 
            'var minCtrl = effect("Min Brightness")("Slider");\n' +
            'var maxCtrl = effect("Max Brightness")("Slider");\n\n' +
            
            'var engine = loopOut("pingpong");\n\n' +
            
            '// Slider\n' +
            'linear(engine, ' + vMin + ', ' + vMax + ', minCtrl, maxCtrl);';

        brightProp.expression = expr;

    } else {
        alert("Vui lòng chọn một Composition.");
    }

    app.endUndoGroup();
}