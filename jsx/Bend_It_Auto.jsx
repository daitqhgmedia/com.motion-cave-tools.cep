// Auto Bent It – v1.0
// by nguyentiendai.03
// Tạo CC Bend It sway nhanh cho nhiều layer với 4 câu hỏi: Duration, Center, Spread, Phase.

(function autoBentIt() {
    // ---------------- Helpers ----------------
    function randRange(min, max) {
        return min + Math.random() * (max - min);
    }

    function clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    }

    // UI: trả về config hoặc null nếu cancel
    function showUI() {
        var durationOptions = [2, 2.5, 3, 4, 5, 6, 12];

        var dlg = new Window("dialog", "Auto Bent It – v1.0  |  nguyentiendai.03");
        dlg.orientation = "column";
        dlg.alignChildren = ["fill", "top"];
        dlg.margins = 12;

        // ------ Header ------
        var header = dlg.add("group");
        header.orientation = "column";
        header.alignChildren = ["left", "center"];

        var title = header.add("statictext", undefined, "Tự động tạo gió đung đưa với CC Bend It");
        try {
            title.graphics.font = ScriptUI.newFont("Arial", "BOLD", 12);
        } catch (e) {}

        header.add("statictext", undefined, "Q1–Q4: chọn chu kỳ, độ cong, độ phân tán và kiểu thời gian.");

        // ------ Q1: Duration ------
        var q1Panel = dlg.add("panel", undefined, "Q1 — Chu kỳ lắc (Duration)");
        q1Panel.orientation = "column";
        q1Panel.alignChildren = ["fill", "top"];
        q1Panel.margins = 10;

        q1Panel.add(
            "statictext",
            undefined,
            "Chọn mốc thời gian 1 chu kỳ lắc (2s → 12s)."
        );

        var q1Group = q1Panel.add("group");
        q1Group.alignChildren = ["fill", "center"];

        var durationSlider = q1Group.add("slider", undefined, 4, 0, durationOptions.length - 1);
        durationSlider.preferredSize.width = 220;

        var durationLabel = q1Group.add("statictext", undefined, "");
        durationLabel.preferredSize.width = 80;

        function updateDurationLabel() {
            var idx = Math.round(durationSlider.value);
            idx = clamp(idx, 0, durationOptions.length - 1);
            var val = durationOptions[idx];
            durationLabel.text = val.toString() + " s";
        }
        durationSlider.onChanging = updateDurationLabel;
        durationSlider.onChange = updateDurationLabel;
        updateDurationLabel(); // init

        // ------ Q2: Bent center ------
        var q2Panel = dlg.add("panel", undefined, "Q2 — Bent Center (độ cong trung tâm)");
        q2Panel.orientation = "column";
        q2Panel.alignChildren = ["fill", "top"];
        q2Panel.margins = 10;

        q2Panel.add(
            "statictext",
            undefined,
            "Gợi ý: 1–8 = Cây cối • 8–15 = Hoa lá • 15–20 = Hiệu ứng mạnh / stylized"
        );

        var q2Group = q2Panel.add("group");
        q2Group.alignChildren = ["fill", "center"];

        var centerSlider = q2Group.add("slider", undefined, 8, 1, 20);
        centerSlider.preferredSize.width = 220;

        var centerLabel = q2Group.add("statictext", undefined, "");
        centerLabel.preferredSize.width = 80;

        function updateCenterLabel() {
            var c = Math.round(centerSlider.value);
            centerLabel.text = c.toString();
        }
        centerSlider.onChanging = updateCenterLabel;
        centerSlider.onChange = updateCenterLabel;
        updateCenterLabel();

        // ------ Q3: Spread ------
        var q3Panel = dlg.add("panel", undefined, "Q3 — Spread (độ phân tán quanh Center)");
        q3Panel.orientation = "column";
        q3Panel.alignChildren = ["fill", "top"];
        q3Panel.margins = 10;

        q3Panel.add(
            "statictext",
            undefined,
            "Spread = 0: tất cả layer dùng cùng 1 giá trị. Spread lớn: mỗi layer cong khác nhau."
        );

        var q3Group = q3Panel.add("group");
        q3Group.alignChildren = ["fill", "center"];

        var spreadSlider = q3Group.add("slider", undefined, 4, 0, 10);
        spreadSlider.preferredSize.width = 220;

        var spreadLabel = q3Group.add("statictext", undefined, "");
        spreadLabel.preferredSize.width = 150;

        function updateSpreadLabel() {
            var c = Math.round(centerSlider.value);
            var s = Math.round(spreadSlider.value);
            var minB = clamp(c - s, 1, 20);
            var maxB = clamp(c + s, 1, 20);
            spreadLabel.text = s.toString() + "  →  Bent random: " + minB + " – " + maxB;
        }
        spreadSlider.onChanging = updateSpreadLabel;
        spreadSlider.onChange = updateSpreadLabel;
        centerSlider.onChanging = function () {
            updateCenterLabel();
            updateSpreadLabel();
        };
        centerSlider.onChange = function () {
            updateCenterLabel();
            updateSpreadLabel();
        };
        updateSpreadLabel();

        // ------ Q4: Phase / thời gian ------
        var q4Panel = dlg.add("panel", undefined, "Q4 — Thời gian đổi góc Bent (Phase)");
        q4Panel.orientation = "column";
        q4Panel.alignChildren = ["left", "top"];
        q4Panel.margins = 10;

        q4Panel.add(
            "statictext",
            undefined,
            "Fixed: tất cả layer đổi hướng cùng lúc (key thẳng hàng)."
        );
        q4Panel.add(
            "statictext",
            undefined,
            "Random: mỗi layer trễ 1 chút (giống rừng cây lắc lệch pha)."
        );

        var phaseGroup = q4Panel.add("group");
        phaseGroup.orientation = "row";
        phaseGroup.alignChildren = ["left", "center"];

        var rbFixed = phaseGroup.add("radiobutton", undefined, "Fixed (cố định)");
        var rbRandom = phaseGroup.add("radiobutton", undefined, "Random (tự động)");
        rbFixed.value = true;

        // ------ Buttons ------
        var btnGroup = dlg.add("group");
        btnGroup.alignment = ["right", "bottom"];

        var btnCancel = btnGroup.add("button", undefined, "Hủy", { name: "cancel" });
        var btnApply = btnGroup.add("button", undefined, "Apply", { name: "ok" });

        var result = null;

        btnApply.onClick = function () {
            var idx = Math.round(durationSlider.value);
            idx = clamp(idx, 0, durationOptions.length - 1);

            var center = Math.round(centerSlider.value);
            var spread = Math.round(spreadSlider.value);

            result = {
                durationIndex: idx,
                durationSec: durationOptions[idx],
                centerBent: center,
                spread: spread,
                phaseMode: rbRandom.value ? "random" : "fixed"
            };

            dlg.close(1);
        };

        btnCancel.onClick = function () {
            result = null;
            dlg.close(0);
        };

        dlg.center();
        dlg.show();

        return result;
    }

    // ---------------- Main ----------------
    try {
        if (!app.project) {
            alert("Auto Bent It — Không tìm thấy project đang mở.");
            return;
        }

        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) {
            alert("Auto Bent It — Hãy mở một composition và chọn các layer cần đung đưa.");
            return;
        }

        var selLayers = comp.selectedLayers;
        if (!selLayers || selLayers.length === 0) {
            alert("Auto Bent It — Không có layer nào được chọn.\nHãy chọn layer cần thêm CC Bend It rồi chạy lại.");
            return;
        }

        var cfg = showUI();
        if (!cfg) {
            // User cancel
            return;
        }

        var dur       = cfg.durationSec;
        var center    = cfg.centerBent;
        var spread    = cfg.spread;
        var phaseMode = cfg.phaseMode;

        var minBent = clamp(center - spread, 1, 20);
        var maxBent = clamp(center + spread, 1, 20);

        app.beginUndoGroup("Auto Bent It v1.0 – nguyentiendai.03");

        // Chuẩn bị Ease chung
        var ezIn  = new KeyframeEase(0.33, 33);
        var ezOut = new KeyframeEase(0.33, 33);

        for (var i = 0; i < selLayers.length; i++) {
            var lyr = selLayers[i];

            // Bỏ qua layer không phải AVLayer hoặc bị khóa
            if (!(lyr instanceof AVLayer) || lyr.locked) {
                continue;
            }

            try {
                var fxGroup = lyr.property("ADBE Effect Parade");
                if (!fxGroup) continue;

                // Reuse hoặc add CC Bend It
                var bendFx = fxGroup.property("CC Bend It");
                if (!bendFx) {
                    bendFx = fxGroup.addProperty("CC Bend It");
                }
                if (!bendFx) continue;

                var bendProp = bendFx.property("Bend");
                if (!bendProp) continue;

                // Xóa key cũ để sạch sẽ
                while (bendProp.numKeys > 0) {
                    bendProp.removeKey(bendProp.numKeys);
                }

                // --- LOGIC THỜI GIAN (key 1 có thể âm, giữ đúng Duration) ---
                var t1, t2;
                if (phaseMode === "fixed") {
                    // Tất cả layer: chiều dài đoạn = dur, kết thúc đúng tại dur
                    t2 = dur;       // key cuối ở đúng vị trí slider
                    t1 = t2 - dur;  // = 0
                } else {
                    // Random: vẫn giữ chiều dài đoạn = dur,
                    // chỉ trượt cả cụm sang trái, key 2 luôn <= dur
                    t2 = randRange(0, dur); // key cuối nằm từ 0 → dur
                    t1 = t2 - dur;          // thường sẽ âm
                }

                // Đảm bảo layer đủ dài để chứa keyframe cuối
                var maxTime = Math.min(comp.duration, t2);
                if (lyr.outPoint < maxTime) {
                    try {
                        lyr.outPoint = maxTime;
                    } catch (eOut) {}
                }

                // Giá trị Bend random
                var bendVal = (minBent === maxBent) ? minBent : randRange(minBent, maxBent);

                // Đặt keyframe
                bendProp.setValueAtTime(t1, 0);
                bendProp.setValueAtTime(t2, bendVal);

                // Ease + interpolation
                bendProp.setInterpolationTypeAtKey(1, KeyframeInterpolationType.BEZIER);
                bendProp.setInterpolationTypeAtKey(2, KeyframeInterpolationType.BEZIER);
                bendProp.setTemporalEaseAtKey(1, [ezIn], [ezOut]);
                bendProp.setTemporalEaseAtKey(2, [ezIn], [ezOut]);

                // Expression loop
                bendProp.expression = 'loopOut("pingpong")';

            } catch (layerErr) {
                $.writeln("[Auto Bent It] Lỗi ở layer '" + lyr.name + "': " + layerErr.toString());
            }
        }

        app.endUndoGroup();

        // Thông báo cuối
        alert(
            "Auto Bent It — Hoàn tất.\n" +
            "Nhớ setting lại điểm Start (đít cây) và End (ngọn cây) của CC Bend It cho từng layer nhé.\n\n" +
            "- nguyentiendai.03"
        );

    } catch (err) {
        try {
            app.endUndoGroup();
        } catch (e) {}
        alert("Auto Bent It — Đã xảy ra lỗi:\n" + err.toString());
    }
})();
