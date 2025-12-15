// Mô tả: Thêm biểu thức loopOut("pingpong") vào tất cả các thuộc tính được chọn (Ví dụ: Position, Rotation, Scale...)

function BoundedRandomLoop() {
    // 1. Kiểm tra xem After Effects có đang mở dự án nào không
    if (app.project === null) {
        alert("Vui lòng mở một dự án After Effects.");
        return;
    }

    // 2. Lấy Composition đang hoạt động (Active Comp)
    var activeComp = app.project.activeItem;
    if (!(activeComp instanceof CompItem)) {
        alert("Vui lòng chọn một Composition.");
        return;
    }

    // 3. Lấy các Layer đang được chọn
    var selectedLayers = activeComp.selectedLayers;
    if (selectedLayers.length === 0) {
        alert("Vui lòng chọn ít nhất một Layer.");
        return;
    }

    // Bắt đầu Undo Group
    app.beginUndoGroup("Add loopOut(\"pingpong\")");

    // Lặp qua từng Layer được chọn
    for (var i = 0; i < selectedLayers.length; i++) {
        var currentLayer = selectedLayers[i];

        // Lấy tất cả các thuộc tính được chọn trong Layer hiện tại
        var selectedProperties = currentLayer.selectedProperties;

        // Lặp qua từng thuộc tính được chọn
        for (var j = 0; j < selectedProperties.length; j++) {
            var currentProperty = selectedProperties[j];

            // 4. Kiểm tra điều kiện:
            // a) Phải là Property (Thuộc tính)
            // b) Phải có Keyframes (điểm dừng) để có thể loop
            // c) Hiện tại chưa có biểu thức nào (để tránh ghi đè nếu đã có)
            if (currentProperty.propertyValueType !== PropertyValueType.NO_VALUE &&
                currentProperty.numKeys > 0 &&
                !currentProperty.expressionEnabled) {

                // 5. Thêm biểu thức
                currentProperty.expression = 'loopOut("pingpong")';

                // Thông báo để người dùng biết thuộc tính nào đã được thêm
                // writeLn("Đã thêm loopOut cho: " + currentLayer.name + " -> " + currentProperty.name); 

            } else if (currentProperty.expressionEnabled) {
                // writeLn("Thuộc tính đã có biểu thức, bỏ qua: " + currentProperty.name);
            } else if (currentProperty.numKeys === 0) {
                // writeLn("Thuộc tính không có keyframe, bỏ qua: " + currentProperty.name);
            }
        }
    }

    // Kết thúc Undo Group
    app.endUndoGroup();

    alert("Hoàn thành việc thêm loopOut(\"pingpong\") cho các thuộc tính đã chọn.");
}

// Chạy hàm chính
BoundedRandomLoop();