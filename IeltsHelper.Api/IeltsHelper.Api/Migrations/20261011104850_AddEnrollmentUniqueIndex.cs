using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IeltsHelper.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddEnrollmentUniqueIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Enrollments_CourseId",
                table: "Enrollments");

            migrationBuilder.CreateIndex(
                name: "IX_Enrollments_CourseId_StudentId",
                table: "Enrollments",
                columns: new[] { "CourseId", "StudentId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Enrollments_CourseId_StudentId",
                table: "Enrollments");

            migrationBuilder.CreateIndex(
                name: "IX_Enrollments_CourseId",
                table: "Enrollments",
                column: "CourseId");
        }
    }
}
