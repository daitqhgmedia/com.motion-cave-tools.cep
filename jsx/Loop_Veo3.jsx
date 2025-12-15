// Veo3 Loop Fix UI — Keyframe Selection (MP4 Check + Pixel Motion)
// by nguyentiendai.03 & Gemini

(function Veo3LoopFixUI() {
    // **********************************************
    // PHẦN 0: HELPERS
    // **********************************************
    function almostEqual(a, b, eps) {
        return Math.abs(a - b) <= eps;
    }

    // **********************************************
    // PHẦN 1: UI
    // **********************************************
    var win = new Window("dialog", "Veo3 Loop Fix UI - Manchester is Red");
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.spacing = 10;
    win.margins = 16;

    // Group 1: Label + Dropdown
    var grpInput = win.add("group");
    grpInput.orientation = "row";
    grpInput.alignChildren = ["left", "center"];
    grpInput.add("statictext", undefined, "Nhập bội số loop (giây):");

    var timeValues = [2, 3, 4, 5, 6, 8, 10, 12];
    var dropDown = grpInput.add("dropdownlist", undefined, timeValues);
    dropDown.size = [80, 25];
    var defaultIndex = 5; // 8s
    dropDown.selection = defaultIndex;

    // Group 2: Slider
    var slider = win.add("slider", undefined, defaultIndex, 0, timeValues.length - 1);
    var lblVal = win.add("statictext", undefined, "Giá trị chọn: " + timeValues[defaultIndex] + "s");
    lblVal.alignment = ["center", "top"];

    dropDown.onChange = function () {
        if (this.selection != null) {
            slider.value = this.selection.index;
            lblVal.text = "Giá trị chọn: " + timeValues[this.selection.index] + "s";
        }
    };

    slider.onChanging = function () {
        var index = Math.round(this.value);
        if (index >= 0 && index < timeValues.length) {
            dropDown.selection = index;
            lblVal.text = "Giá trị chọn: " + timeValues[index] + "s";
        }
    };

    // Checkbox Pixel Motion
    var chkPixel = win.add("checkbox", undefined, "Sử dụng Pixel Motion");
    chkPixel.value = true;

    // Group 3: Buttons
    var grpBtn = win.add("group");
    grpBtn.orientation = "row";
    grpBtn.alignment = ["center", "bottom"];
    var btnRun = grpBtn.add("button", undefined, "RUN FIX LOOP");
    var btnCancel = grpBtn.add("button", undefined, "Cancel");

    // Group 4: Signature
    var grpSig = win.add("group");
    grpSig.alignment = ["center", "bottom"];
    grpSig.add("statictext", undefined, "Scripts by nguyentiendai.03");

    // **********************************************
    // HÀM PIXEL MOTION
    // **********************************************
    function forcePixelMotion(comp, layer) {
        try { comp.frameBlending = true; } catch (e) {}
        try { layer.frameBlending = true; } catch (e) {}
        try {
            if (typeof FrameBlendingType !== "undefined") {
                if (FrameBlendingType.PIXEL_MOTION !== undefined)
                    layer.frameBlendingType = FrameBlendingType.PIXEL_MOTION;
                else if (FrameBlendingType.FRAME_PIXEL_MOTION !== undefined)
                    layer.frameBlendingType = FrameBlendingType.FRAME_PIXEL_MOTION;
                else if (FrameBlendingType.FRAME_MIX !== undefined)
                    layer.frameBlendingType = FrameBlendingType.FRAME_MIX;
            } else {
                layer.frameBlendingType = 2; // fallback
            }
        } catch (e) {}
    }

    // **********************************************
    // LOGIC CHÍNH
    // **********************************************
    btnRun.onClick = function () {
        if (!dropDown.selection) {
            alert("Chọn thời lượng loop trước khi chạy.");
            return;
        }

        var selectedTime = parseInt(dropDown.selection.text, 10); // giây
        var usePixelMotion = chkPixel.value;

        win.close();

        app.beginUndoGroup("Veo3 Loop Fix — " + selectedTime + "s");

        var comp = app.project.activeItem;
        if (!(comp && comp instanceof CompItem)) {
            alert("Mở một comp và chọn layer trước khi chạy.");
            app.endUndoGroup();
            return;
        }

        var sel = comp.selectedLayers;
        if (!sel || sel.length === 0) {
            alert("Chọn ít nhất một VIDEO layer.");
            app.endUndoGroup();
            return;
        }

        // Loop từng layer
        for (var i = 0; i < sel.length; i++) {
            var lyr = sel[i];

            // 1. Kiểm tra cơ bản
            if (!(lyr instanceof AVLayer) || !lyr.source) continue;

            var src = lyr.source;
            if (!(src instanceof FootageItem) || !src.mainSource || src.mainSource.isStill) continue;

            // 2. Check MP4
            var isMp4 = false;
            if (src.file) {
                if (src.file.name.toLowerCase().indexOf(".mp4") !== -1) {
                    isMp4 = true;
                }
            }
            if (!isMp4) {
                alert("Đây đéo phải video Veo 3, đừng có mà chạy linh tinh");
                continue;
            }

            // 3. LẤY FPS VÀ THỜI LƯỢNG GỐC
var ms = src.mainSource;
var fps = ms.conformFrameRate;
if (!fps || fps <= 0) fps = src.frameRate;
var dur = src.duration;

// ---------------------------
// CASE 1: 8s @ 24fps
// ---------------------------
var case1DurTarget = 8.0; // 8 giây
var isCase1 = almostEqual(dur, case1DurTarget, 0.05) &&
              almostEqual(fps, 24.0, 0.1);

// ------------------------------------------
// CASE 2: 30fps, duration từ 7s28f đến 8s01f
// 7s28f = 7 + 28/30
// 8s01f = 8 +  1/30
// ------------------------------------------
var case2MinDur = 7 + 28/30; // 7.9333...
var case2MaxDur = 8 +  1/30; // 8.0333...
var epsDur      = 0.05;

var isCase2 = almostEqual(fps, 30.0, 0.1) &&
              (dur >= case2MinDur - epsDur) &&
              (dur <= case2MaxDur + epsDur);

if (!isCase1 && !isCase2) {
    // Không đúng 2 case Veo3 đã định nghĩa -> bỏ qua
    continue;
}

// Phần dưới vẫn giữ nguyên:
// - targetFPS = 30
// - fixedDurationFrames = 6s4f / 7s20f
// - targetValueFrames = 6s3f / 7s19f
// - Precomp + trim fixedDuration
// - Time Remap tới targetValue + loopOut()
// - Pixel Motion (optional)
// - Kéo outPoint = comp.duration


            // Chuẩn bị thông số chung
            var targetFPS = 30;
            var fixedDurationFrames;
            var targetValueFrames;

            if (isCase1) {
                // Case 1 – Footage 8s @ 24fps → conform 30fps, trim 6s4f, remap 6s3f
                ms.conformFrameRate = targetFPS;

                fixedDurationFrames = 6 * targetFPS + 4;  // 6s4f = 184f
                targetValueFrames   = 6 * targetFPS + 3;  // 6s3f = 183f
            } else {
                // Case 2 – Footage 7s28f hoặc 8s01f @ 30fps → trim 7s20f, remap 7s19f
                ms.conformFrameRate = targetFPS; // đảm bảo 30fps

                fixedDurationFrames = 7 * targetFPS + 20;      // 7s20f = 230f
                targetValueFrames   = fixedDurationFrames - 1; // 7s19f = 229f
            }

            var fixedDuration = fixedDurationFrames / targetFPS;
            var targetValue   = targetValueFrames   / targetFPS;

            // Footage ngắn hơn đoạn cần trim thì bỏ qua
            if (dur < fixedDuration) {
                continue;
            }

            // 2. Precomp + cắt còn fixedDuration
            var oldIndex = lyr.index;
            var preName  = lyr.name + " MU vô đối";
            var preComp  = comp.layers.precompose([oldIndex], preName, true);
            if (!preComp) continue;

            var preLayer = comp.layer(oldIndex);
            if (!preLayer) continue;

            preComp.duration = fixedDuration;
            var inner = preComp.layer(1);
            if (inner) {
                inner.startTime = 0;
                inner.inPoint   = 0;
                inner.outPoint  = fixedDuration;
            }

            // 3. Đảm bảo layer ngoài đủ dài
            if (preLayer.outPoint < preLayer.inPoint + selectedTime) {
                preLayer.outPoint = preLayer.inPoint + selectedTime + 1;
            }

            // 4. Time Remap + loopOut
            preLayer.timeRemapEnabled = true;
            var tr = preLayer.timeRemap;
            if (!tr) continue;

            if (tr.numKeys >= 2) {
                tr.removeKey(tr.numKeys); // xoá key cuối mặc định
            }

            // key 1: comp 0s -> footage 0s
            tr.setValueAtKey(1, 0);

            // key 2: comp selectedTime -> footage targetValue
            tr.setValueAtTime(selectedTime, targetValue);

            tr.expression = 'loopOut()';

            // 5. Pixel Motion (nếu tick)
            if (usePixelMotion) {
                forcePixelMotion(comp, preLayer);
            }

            // 6. Kéo layer phủ full comp
            preLayer.outPoint = comp.duration;
        }

        app.endUndoGroup();
    };

    btnCancel.onClick = function () {
        win.close();
    };

    win.show();
})();
