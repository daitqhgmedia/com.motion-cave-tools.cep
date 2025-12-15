(function timeStretchOrExtendDuration() {
    var proj = app.project; // Lấy project hiện tại
    if (!proj) {
        alert("Không có project nào đang mở.");
        return;
    }

    app.beginUndoGroup("Time Stretch or Extend to Comp Duration");

    var activeComp = app.project.activeItem; // Lấy composition đang hiển thị
    if (!activeComp || !(activeComp instanceof CompItem)) {
        alert("Hãy mở một Composition để chạy script này.");
        return;
    }

    var selectedLayers = activeComp.selectedLayers; // Lấy các layer đang được chọn
    if (selectedLayers.length === 0) {
        alert("Vui lòng chọn ít nhất một layer.");
        return;
    }

    var compDuration = activeComp.duration; // Lấy thời gian dài nhất của composition
    var noStretchableLayers = true; // Biến kiểm tra nếu không có layer hợp lệ

    for (var i = 0; i < selectedLayers.length; i++) {
        var layer = selectedLayers[i];
        var layerType = layer.source ? layer.source.typeName : layer.matchName;

        if (layerType === "Footage" || layerType === "Composition") {
            // Nếu là Footage hoặc Composition, áp dụng Time Stretch
            var originalDuration = layer.outPoint - layer.inPoint;
            var stretchFactor = (compDuration / originalDuration) * 100; // Tính Stretch Factor (%)
            layer.stretch = stretchFactor; // Áp dụng Stretch Factor
            noStretchableLayers = false; // Có ít nhất 1 layer stretchable
        } else {
            // Nếu là Solid, Text hoặc loại khác, chỉ kéo dài thời gian layer
            layer.outPoint = compDuration;
        }
    }

    app.endUndoGroup();

    if (noStretchableLayers) {
        alert("Không có layer Footage hoặc Composition nào để áp dụng Time Stretch.");
    }
})();