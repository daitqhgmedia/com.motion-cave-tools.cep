/**
 * Water Overlay PRO - Smart UI (Context Aware)
 * by nguyentiendai.03
 */

(function(thisObj) {
    
    function buildUI(thisObj) {
        var win = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Water Gen Smart - Manchester Is Red", undefined, {resizeable: true});
        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.spacing = 10;
        win.margins = 16;

        // --- 1. KIỂM TRA TRẠNG THÁI LAYER ĐẦU VÀO ---
        var activeComp = app.project.activeItem;
        var isCompOpen = (activeComp instanceof CompItem);
        var isOneLayerSelected = (isCompOpen && activeComp.selectedLayers.length === 1);

        // --- HEADER ---
        var groupHead = win.add("group");
        groupHead.orientation = "column";
        groupHead.alignChildren = ["center", "center"];
        var title = groupHead.add("statictext", undefined, "WATER OVERLAY PRO");
        title.graphics.font = ScriptUI.newFont("Verdana", "BOLD", 16);
        title.graphics.foregroundColor = title.graphics.newPen(title.graphics.PenType.SOLID_COLOR, [0.2, 0.6, 1], 1);

        // --- SMART OPTIONS PANEL ---
        var panelOpt = win.add("panel", undefined, "Chọn Chế Độ:");
        panelOpt.orientation = "column";
        panelOpt.alignChildren = ["left", "top"];
        panelOpt.margins = 15;
        panelOpt.spacing = 10;

        // Option 1: Biến Layer thành nước
        var radioLayer = panelOpt.add("radiobutton", undefined, "Biến Layer đang chọn thành nước");
        radioLayer.helpTip = "Chuyển layer bạn đang chọn thành mặt nước chuyển động.";

        // Option 2: Tạo Mask thủ công
        var radioMask = panelOpt.add("radiobutton", undefined, "Tạo lớp nước trống (Vẽ Mask)");
        radioMask.helpTip = "Tạo một layer Adjustment trống để bạn tự vẽ vùng nước bằng công cụ Pen/Mask.";

        // --- LOGIC UI THÔNG MINH ---
        if (isOneLayerSelected) {
            // Nếu đã chọn 1 layer: Cho phép chọn cả 2, mặc định chọn Opt 1
            radioLayer.enabled = true;
            radioLayer.value = true; 
            radioMask.value = false;
        } else {
            // Nếu chưa chọn layer nào: Khóa Opt 1, ép dùng Opt 2
            radioLayer.enabled = false; // Disable (Không thể tích)
            radioLayer.value = false;
            radioMask.value = true; // Auto tích Opt 2
        }

        // --- ACTION BUTTON ---
        var btnRun = win.add("button", undefined, "KÍCH HOẠT");
        btnRun.preferredSize.height = 40;

        // --- FOOTER ---
        var line = win.add("panel");
        line.alignment = "fill";
        line.preferredSize.height = 1;

        var credit = win.add("statictext", undefined, "Scripts by nguyentiendai.03");
        credit.alignment = "center";
        credit.graphics.foregroundColor = credit.graphics.newPen(credit.graphics.PenType.SOLID_COLOR, [0.5, 0.5, 0.5], 1);
        credit.graphics.font = ScriptUI.newFont("Arial", "ITALIC", 10);

        // --- SỰ KIỆN CLICK ---
        btnRun.onClick = function() {
            if (!isCompOpen) {
                alert("Vui lòng mở một Composition trước.");
                return;
            }

            // Xác định Mode dựa trên Radio Button nào đang được tích
            var mode = radioLayer.value ? "LAYER_MODE" : "MASK_MODE";
            
            // Chạy hàm xử lý chính với Mode đã chọn
            var success = runWaterScript(mode); 
            
            if (success) {
                if (win instanceof Window) { win.close(); } else { win.close(); }
            }
        };

        if (win instanceof Window) {
            win.center();
            win.show();
        } else {
            win.layout.layout(true);
        }
    }

    // --- CORE LOGIC (NHẬN THAM SỐ MODE TỪ UI) ---
    function runWaterScript(mode) {
        app.beginUndoGroup("Water Overlay Create");
        try {
            var mainComp = app.project.activeItem;
            var targetW = mainComp.width;
            var targetH = mainComp.height;
            
            // --- Helpers (Giữ nguyên logic xịn nhất) ---
            function setupNoiseLayer(layer, w, h, speedPath, widthPath, heightPath) {
                var newPos = (w >= 3840) ? [1920, 1408] : [960, 690];             
                layer.property("ADBE Transform Group").property("ADBE Position").setValue(newPos);

                var fractal = layer.property("Effects").property("ADBE Fractal Noise");
                if (!fractal) fractal = layer.property("Effects").addProperty("ADBE Fractal Noise");
                
                if (fractal) {
                    fractal.property("Fractal Type").setValue(13);
                    fractal.property("Contrast").setValue(138);
                    fractal.property("Brightness").setValue(-48);
                    fractal.property("Uniform Scaling").setValue(false);

                    var wExp = "try { " + widthPath + " * 18.3; } catch(e) { 183; }";
                    fractal.property("Scale Width").expression = wExp;
                    
                    var hExp = "try { " + heightPath + " * 2.5; } catch(e) { 25; }";
                    fractal.property("Scale Height").expression = hExp;
                    
                    var off = fractal.property("Offset Turbulence");
                    if(off.numKeys > 0) { for (var k = off.numKeys; k > 0; k--) off.removeKey(k); }
                    
                    off.setValue([w / 2, h / 2]);
                    var speedExp = "try { var spd = " + speedPath + "; [value[0], value[1] + (time * spd)]; } catch(e) { value; }";
                    off.expression = speedExp; 
                    
                    fractal.property("Evolution").expression = "time*15";
                }
                var basic3D = layer.property("Effects").property("ADBE Basic 3D");
                if (!basic3D) basic3D = layer.property("Effects").addProperty("ADBE Basic 3D");
                if (basic3D) basic3D.property("Tilt").setValue(-56);
            }

            function getOrCreateExternalController(targetComp) {
                var existingNull = null;
                for (var i = 1; i <= targetComp.numLayers; i++) {
                    if (targetComp.layer(i).name === "Water Control" && targetComp.layer(i).nullLayer) {
                        existingNull = targetComp.layer(i); break;
                    }
                }
                if (existingNull) return existingNull;

                var nullLayer = targetComp.layers.addNull();
                nullLayer.name = "Water Control";
                nullLayer.label = 1; 
                var p1 = nullLayer.property("Effects").addProperty("ADBE Slider Control"); p1.name = "Water Strength"; p1.property("Slider").setValue(6); 
                var p2 = nullLayer.property("Effects").addProperty("ADBE Slider Control"); p2.name = "Water Speed"; p2.property("Slider").setValue(50);
                var p3 = nullLayer.property("Effects").addProperty("ADBE Slider Control"); p3.name = "Wave Width"; p3.property("Slider").setValue(10); 
                var p4 = nullLayer.property("Effects").addProperty("ADBE Slider Control"); p4.name = "Wave Height"; p4.property("Slider").setValue(10); 
                nullLayer.moveToBeginning();
                return nullLayer;
            }

            function createNoiseComp(w, h, speedPath, widthPath, heightPath) {
                var randomID = Math.floor(Math.random() * 10000);
                var compName = "Noise " + randomID;
                var noiseComp = app.project.items.addComp(compName, w, h, 1, 32, 30);
                var solid = noiseComp.layers.addSolid([1,1,1], "Noise Solid", w, h, 1, noiseComp.duration);
                setupNoiseLayer(solid, w, h, speedPath, widthPath, heightPath);
                return noiseComp;
            }

            function addDisplacementWithLink(layer, targetLayerIndex, pathExpr) {
                var disp = layer.property("Effects").addProperty("ADBE Displacement Map");
                if (disp) {
                    disp.property("Displacement Map Layer").setValue(targetLayerIndex);
                    var strExp = "try { " + pathExpr + "; } catch(e) { 6; }";
                    disp.property("Max Horizontal Displacement").expression = strExp;
                    disp.property("Max Vertical Displacement").expression = strExp;
                    disp.property("Edge Behavior").setValue(1); 
                }
            }
            
            function addMotionTile(layer) {
                var tile = layer.property("Effects").addProperty("Motion Tile");
                if (tile) {
                    tile.property("Output Width").setValue(350); tile.property("Output Height").setValue(370); tile.property("Mirror Edges").setValue(true);
                }
            }

            // --- PREPARE PATHS ---
            var nullCtrl = getOrCreateExternalController(mainComp);
            var nullCtrlName = nullCtrl.name;
            var absNullPath = 'comp("' + mainComp.name + '").layer("' + nullCtrlName + '")';
            var absSpeedPath = absNullPath + '.effect("Water Speed")("Slider")';
            var absWidthPath = absNullPath + '.effect("Wave Width")("Slider")';
            var absHeightPath = absNullPath + '.effect("Wave Height")("Slider")';
            var absStrPath    = absNullPath + '.effect("Water Strength")("Slider")';

            // --- EXECUTE BASED ON MODE ---
            if (mode === "LAYER_MODE") {
                // Chế độ 1: Biến Layer đang chọn
                var layer = mainComp.selectedLayers[0]; // Chắc chắn có vì UI đã check
                var layerIndex = layer.index; // Store the index to safely retrieve the precomp later

                // Create a new, unique noise comp for each run
                var noiseComp = createNoiseComp(targetW, targetH, absSpeedPath, absWidthPath, absHeightPath);
                
                var newName = layer.name + "_WaterFX_" + Math.floor(Math.random() * 1000);
                mainComp.layers.precompose([layerIndex], newName, true);

                // Safely get the new precomp by its index instead of searching by name
                var precompLayer = mainComp.layer(layerIndex);
                var precomp = precompLayer.source;

                var noiseLayer = precomp.layers.add(noiseComp);
                noiseLayer.enabled = false; noiseLayer.shy = true; noiseLayer.moveToBeginning();

                var adj = precomp.layers.addSolid([1,1,1],"Water Displace (Adj)",precomp.width,precomp.height,precomp.pixelAspect,precomp.duration);
                adj.adjustmentLayer = true; adj.moveToBeginning();
                addMotionTile(adj);
                addDisplacementWithLink(adj, noiseLayer.index, absStrPath);
                precomp.hideShyLayers = true;

            } else {
                // Chế độ 2: Tạo Mask (MASK_MODE)
                var noiseComp2 = createNoiseComp(targetW, targetH, absSpeedPath, absWidthPath, absHeightPath);
                var adj2 = mainComp.layers.addSolid([1,1,1],"Mask Here bro!!",targetW,targetH,mainComp.pixelAspect,mainComp.duration);
                adj2.adjustmentLayer = true; 
                adj2.moveAfter(nullCtrl); 
                addMotionTile(adj2);
                var noiseLayer2 = mainComp.layers.add(noiseComp2);
                noiseLayer2.enabled = false; noiseLayer2.shy = true; noiseLayer2.moveAfter(adj2);
                var localStrPath = 'thisComp.layer("' + nullCtrlName + '").effect("Water Strength")("Slider")';
                addDisplacementWithLink(adj2, noiseLayer2.index, localStrPath);
                mainComp.hideShyLayers = true;
            }
            
            return true;

        } catch (err) {
            alert("Lỗi: " + err.message);
            return false;
        } finally {
            app.endUndoGroup();
        }
    }

    buildUI(thisObj);

})(this);