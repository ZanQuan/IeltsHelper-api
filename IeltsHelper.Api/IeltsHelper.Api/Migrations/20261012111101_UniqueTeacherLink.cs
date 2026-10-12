using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IeltsHelper.Api.Migrations
{
    /// <inheritdoc />
    public partial class UniqueTeacherLink : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TeacherStudentLinks_TeacherId",
                table: "TeacherStudentLinks");

            migrationBuilder.CreateIndex(
                name: "IX_TeacherStudentLinks_TeacherId_StudentId",
                table: "TeacherStudentLinks",
                columns: new[] { "TeacherId", "StudentId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TeacherStudentLinks_TeacherId_StudentId",
                table: "TeacherStudentLinks");

            migrationBuilder.CreateIndex(
                name: "IX_TeacherStudentLinks_TeacherId",
                table: "TeacherStudentLinks",
                column: "TeacherId");
        }
    }
}
