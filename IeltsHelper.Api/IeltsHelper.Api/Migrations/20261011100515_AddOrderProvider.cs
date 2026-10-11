using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IeltsHelper.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderProvider : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "TxnRef",
                table: "Orders",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<string>(
                name: "Provider",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ProviderTransId",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Orders_TxnRef",
                table: "Orders",
                column: "TxnRef",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Orders_TxnRef",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "Provider",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "ProviderTransId",
                table: "Orders");

            migrationBuilder.AlterColumn<string>(
                name: "TxnRef",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");
        }
    }
}
