// Set AutoSway (Pin2) Distance & Speed for all selected layers
(function () {
	app.beginUndoGroup("Set AutoSway Distance & Speed");

	var comp = app.project.activeItem;
	if (
		!(comp && comp instanceof CompItem) ||
		comp.selectedLayers.length === 0
	) {
		alert("Chọn ít nhất 1 layer.");
		return;
	}

	// Tạo dialog nhập Distance và Speed cùng lúc
	var dlg = new Window("dialog", "AutoSway - Distance & Speed");
	dlg.alignChildren = "fill";

	var distGroup = dlg.add("group");
	distGroup.add("statictext", undefined, "Sway distance:");
	var distInput = distGroup.add("edittext", undefined, "120");
	distInput.characters = 10;

	var speedGroup = dlg.add("group");
	speedGroup.add("statictext", undefined, "Sway speed:");
	var speedInput = speedGroup.add("edittext", undefined, "50");
	speedInput.characters = 10;

	var btnGroup = dlg.add("group");
	btnGroup.alignment = "center";
	var cancelBtn = btnGroup.add("button", undefined, "Cancel");
	var okBtn = btnGroup.add("button", undefined, "OK");
	okBtn.active = true; // Đặt OK làm nút mặc định (Enter)

	okBtn.onClick = function () {
		dlg.close(1);
	};
	cancelBtn.onClick = function () {
		dlg.close(0);
	};

	if (dlg.show() !== 1) {
		app.endUndoGroup();
		return;
	}

	var dist = parseFloat(distInput.text),
		speed = parseFloat(speedInput.text);
	if (isNaN(dist) || isNaN(speed)) {
		alert("Giá trị không hợp lệ.");
		app.endUndoGroup();
		return;
	}

	// Helper tìm effect AutoSway_Pin2 theo matchName/name
	function getAutoSway(layer) {
		var fx = layer.property("ADBE Effect Parade");
		if (!fx) return null;
		return (
			fx.property("Pseudo/d3a1uID/AutoSway_Pin2") || // matchName
			fx.property("AutoSway_Pin2") || // display name thường thấy
			fx.property("AutoSway") || // phòng hờ
			null
		);
	}

	var changed = 0,
		skipped = [];
	for (var i = 0; i < comp.selectedLayers.length; i++) {
		var ly = comp.selectedLayers[i];
		var eff = getAutoSway(ly);
		if (!eff) {
			skipped.push(ly.name + " (không có AutoSway_Pin2)");
			continue;
		}

		// property index theo dump:
		// 1 = Sway distance, 3 = Sway Speed
		var pDist = eff.property(1),
			pSpeed = eff.property(3);
		if (pDist) pDist.setValue(dist);
		if (pSpeed) pSpeed.setValue(speed);
		changed++;
	}

	app.endUndoGroup();

	if (changed === 0) {
		alert(
			"Không áp được layer nào.\n" +
				(skipped.length ? "Bỏ qua:\n- " + skipped.join("\n- ") : "")
		);
	}
})();
