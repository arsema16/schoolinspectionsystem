async function loadReport() {
    const res = await fetch("/api/report");
    const data = await res.json();

    const reportDiv = document.getElementById("report");

    reportDiv.innerHTML = `
        <h3>Year Analysis</h3>
        <p>Highest Entrance Year: ${data.highestEntranceYear}</p>
        <p>Highest Entrance Score: ${data.highestEntranceScore}</p>
        <p>Predicted Next Graduation Score: ${data.predictedNextGraduationScore}</p>
        <p>Recommended Entrance Target: ${data.recommendedEntranceTarget}</p>

        <h3>Maintenance Requests</h3>
        <p>Laboratories requiring upgrade: ${data.labMaintenance.length}</p>
        <p>Classrooms requiring expansion: ${data.classroomMaintenance.length}</p>

        <h3>Teaching Recommendation</h3>
        <p>Adopt strategy from: ${data.recommendedTeachingModel}</p>
    `;
}