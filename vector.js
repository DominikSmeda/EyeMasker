
function dot(vec1, vec2) {
    return Number(vec2.x * vec1.x) + Number(vec2.y * vec1.y);
}

function det(vec1, vec2) {
    return Number(vec2.x * vec1.y) - Number(vec2.y * vec1.x);
}

function angleBetween360(vec1, vec2) {
    return Math.atan2(det(vec1, vec2), dot(vec1, vec2))
}

