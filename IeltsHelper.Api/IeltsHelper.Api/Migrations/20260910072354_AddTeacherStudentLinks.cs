using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IeltsHelper.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTeacherStudentLinks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TeacherStudentLinks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TeacherId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StudentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TeacherStudentLinks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TeacherStudentLinks_Users_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TeacherStudentLinks_Users_TeacherId",
                        column: x => x.TeacherId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TeacherStudentLinks_StudentId",
                table: "TeacherStudentLinks",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_TeacherStudentLinks_TeacherId",
                table: "TeacherStudentLinks",
                column: "TeacherId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TeacherStudentLinks");
        }
    }
}
