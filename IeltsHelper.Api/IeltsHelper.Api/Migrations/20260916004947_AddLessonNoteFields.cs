using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IeltsHelper.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddLessonNoteFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GrammarNotes",
                table: "LessonLogs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NewVocabulary",
                table: "LessonLogs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OtherNotes",
                table: "LessonLogs",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GrammarNotes",
                table: "LessonLogs");

            migrationBuilder.DropColumn(
                name: "NewVocabulary",
                table: "LessonLogs");

            migrationBuilder.DropColumn(
                name: "OtherNotes",
                table: "LessonLogs");
        }
    }
}
