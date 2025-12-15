(function createWaterEffectWithController() {
    app.beginUndoGroup("Create Water Effect");

    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
        alert("Please select a composition first.");
        return;
    }

    // --- Configuration for Default Values ---
    var defaults = {
        contrast: 138,
        brightness: -48,
        scaleWidth: 183,
        scaleHeight: 25,
        evolutionSpeed: 15,
        offsetYSpeed: 300
    };

    // Find the topmost selected layer to place the new layers above it.
    var topMostSelectedLayer = null;
    if (comp.selectedLayers.length > 0) {
        topMostSelectedLayer = comp.selectedLayers[0];
        for (var i = 1; i < comp.selectedLayers.length; i++) {
            if (comp.selectedLayers[i].index < topMostSelectedLayer.index) {
                topMostSelectedLayer = comp.selectedLayers[i];
            }
        }
    }
    
    // --- 1. Create Unique Controller Name & Layer ---
    var compName = comp.name;
    var sanitizedCompName = compName.replace(/[^a-zA-Z0-9_]/g, "_");
    var controllerName = "Water_Controller_" + sanitizedCompName;
    
    var controlNull = comp.layers.addNull(comp.duration);
    controlNull.name = controllerName;
    controlNull.source.name = controllerName;

    var fx = controlNull.property("ADBE Effect Parade");

    // --- 2. Add Slider Controls to Null using Defaults ---
    fx.addProperty("ADBE Slider Control").name = "Contrast";
    fx.property("Contrast").property("Slider").setValue(defaults.contrast);

    fx.addProperty("ADBE Slider Control").name = "Brightness";
    fx.property("Brightness").property("Slider").setValue(defaults.brightness);

    fx.addProperty("ADBE Slider Control").name = "Scale Width";
    fx.property("Scale Width").property("Slider").setValue(defaults.scaleWidth);
    
    fx.addProperty("ADBE Slider Control").name = "Scale Height";
    fx.property("Scale Height").property("Slider").setValue(defaults.scaleHeight);
    
    fx.addProperty("ADBE Slider Control").name = "Evolution Speed";
    fx.property("Evolution Speed").property("Slider").setValue(defaults.evolutionSpeed);

    fx.addProperty("ADBE Slider Control").name = "Offset Y Speed";
    fx.property("Offset Y Speed").property("Slider").setValue(defaults.offsetYSpeed);

    // --- 3. Create Water Map Solid Layer ---
    var solidColor = [0.0, 0.0, 0.0];
    var solidName = "Water_Map_" + sanitizedCompName;
    var waterMap = comp.layers.addSolid(solidColor, solidName, comp.width, comp.height, comp.pixelAspect, comp.duration);

    // --- 4. Add and Configure Fractal Noise ---
    var fractalEffect = waterMap.property("ADBE Effect Parade").addProperty("ADBE Fractal Noise");
    fractalEffect.property("Fractal Type").setValue(13);
    
    fractalEffect.property(9).setValue(false); // Property 9 is "Uniform Scaling"

    // --- 5. Generate and Apply Search-Based Expressions ---
    function createSliderExpression(propName) {
        return [
            'var targetLayer = null;',
            'for (var i = 1; i <= thisComp.numLayers; i++){',
            '    if (thisComp.layer(i).name.indexOf("Water_Controller") !== -1){',
            '        targetLayer = thisComp.layer(i);',
            '        break;',
            '    }',
            '}',
            'if (targetLayer !== null){',
            '    try { targetLayer.effect("' + propName + '")("Slider") } catch(e) { value }',
            '} else {',
            '    value;',
            '}'
        ].join('\n');
    }

    var evolutionExpression = [
        'var targetLayer = null;',
        'for (var i = 1; i <= thisComp.numLayers; i++){',
        '    if (thisComp.layer(i).name.indexOf("Water_Controller") !== -1){',
        '        targetLayer = thisComp.layer(i);',
        '        break;',
        '    }',
        '}',
        'var speed = ' + defaults.evolutionSpeed + ';',
        'if (targetLayer !== null){',
        '    try { speed = targetLayer.effect("Evolution Speed")("Slider") } catch(e) { }',
        '}',
        'time * speed;'
    ].join('\n');

    var offsetExpression = [
        'var targetLayer = null;',
        'for (var i = 1; i <= thisComp.numLayers; i++){',
        '    if (thisComp.layer(i).name.indexOf("Water_Controller") !== -1){',
        '        targetLayer = thisComp.layer(i);',
        '        break;',
        '    }',
        '}',
        'var spd = ' + defaults.offsetYSpeed + ';',
        'if (targetLayer !== null){',
        '    try { spd = targetLayer.effect("Offset Y Speed")("Slider") } catch(e) { }',
        '}',
        '[value[0], time * spd];'
    ].join('\n');

    fractalEffect.property("Contrast").expression = createSliderExpression("Contrast");
    fractalEffect.property("Brightness").expression = createSliderExpression("Brightness");
    
    fractalEffect.property("Scale Width").expression = createSliderExpression("Scale Width");
    fractalEffect.property("Scale Height").expression = createSliderExpression("Scale Height");

    fractalEffect.property("Evolution").expression = evolutionExpression;
    fractalEffect.property("Offset Turbulence").expression = offsetExpression;

    // --- 6. Create Water Mask Adjustment Layer and Effects ---
    var maskSolidName = "Water_Mask_" + sanitizedCompName;
    var maskLayer = comp.layers.addSolid(solidColor, maskSolidName, comp.width, comp.height, comp.pixelAspect, comp.duration);
    maskLayer.adjustmentLayer = true;
    var maskEffects = maskLayer.property("ADBE Effect Parade");

    var motionTile = maskEffects.addProperty("ADBE Tile");
    motionTile.property("Output Width").setValue(350);
    motionTile.property("Output Height").setValue(370);
    motionTile.property("Mirror Edges").setValue(true);

    var displace = maskEffects.addProperty("ADBE Displacement Map");
    displace.property("Displacement Map Layer").setValue(waterMap.index);
    displace.property(2).setValue(13); // Use Luminance from Effects & Masks for Horizontal
    displace.property(4).setValue(13); // Use Luminance from Effects & Masks for Vertical

    // --- 7. Set Final Layer Order and Position ---
    if (topMostSelectedLayer) {
        waterMap.moveBefore(topMostSelectedLayer);
        maskLayer.moveBefore(waterMap);
        controlNull.moveBefore(maskLayer);
    } else {
        waterMap.moveToBeginning();
        maskLayer.moveBefore(waterMap);
        controlNull.moveBefore(maskLayer);
    }

    app.endUndoGroup();
})();