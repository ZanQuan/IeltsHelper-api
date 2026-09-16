using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using IeltsHelper.Api.Models;

namespace IeltsHelper.Api.Services;

/// <summary>
/// Xuất "Nhật ký buổi học" (LessonLog) ra file Word (.docx) dưới dạng bảng,
/// để học viên có thể tải về và xem lại những gì đã học.
/// </summary>
public class LessonLogWordExportService
{
    private static readonly string[] Headers =
    {
        "Ngày học",
        "Kỹ năng",
        "Tóm tắt",
        "Từ vựng mới",
        "Ngữ pháp / Cấu trúc",
        "Ghi chú khác",
        "Bài tập về nhà",
        "Tự đánh giá"
    };

    // Độ rộng cột (đơn vị: 1/20 point, tổng ~9350 = khổ A4 trừ lề)
    private static readonly int[] ColumnWidths = { 950, 850, 1300, 1300, 1300, 1300, 1150, 600 };

    public byte[] ExportLessonLogs(List<LessonLog> logs, string? studentName)
    {
        using var stream = new MemoryStream();

        using (var doc = WordprocessingDocument.Create(stream, WordprocessingDocumentType.Document))
        {
            var mainPart = doc.AddMainDocumentPart();
            mainPart.Document = new Document();
            var body = mainPart.Document.AppendChild(new Body());

            body.AppendChild(BuildHeading("NHẬT KÝ BUỔI HỌC"));

            var subtitleText = studentName != null
                ? $"Học viên: {studentName}   |   Ngày xuất: {DateTime.Now:dd/MM/yyyy}"
                : $"Ngày xuất: {DateTime.Now:dd/MM/yyyy}";
            body.AppendChild(BuildParagraph(subtitleText, italic: true));

            body.AppendChild(new Paragraph(new Run(new Text(string.Empty))));

            if (logs.Count == 0)
            {
                body.AppendChild(BuildParagraph("Chưa có buổi học nào được ghi lại."));
            }
            else
            {
                // Khổ ngang (landscape) để bảng nhiều cột không bị chật
                body.AppendChild(BuildTable(logs));
            }

            var sectionProps = new SectionProperties(
                new PageSize { Width = 16838, Height = 11906, Orient = PageOrientationValues.Landscape },
                new PageMargin { Top = 720, Right = 620, Bottom = 720, Left = 620 });
            body.AppendChild(sectionProps);

            mainPart.Document.Save();
        }

        return stream.ToArray();
    }

    private static Paragraph BuildHeading(string text)
    {
        var run = new Run(new Text(text));
        run.PrependChild(new RunProperties(new Bold(), new FontSize { Val = "32" }));

        var paragraph = new Paragraph(run);
        paragraph.ParagraphProperties = new ParagraphProperties(
            new Justification { Val = JustificationValues.Center },
            new SpacingBetweenLines { After = "200" });

        return paragraph;
    }

    private static Paragraph BuildParagraph(string text, bool italic = false)
    {
        var runProps = new RunProperties();
        if (italic) runProps.Append(new Italic());
        runProps.Append(new Color { Val = "555555" });

        var run = new Run(runProps, new Text(text));
        var paragraph = new Paragraph(run);
        paragraph.ParagraphProperties = new ParagraphProperties(
            new Justification { Val = JustificationValues.Center });

        return paragraph;
    }

    private static Table BuildTable(List<LessonLog> logs)
    {
        var table = new Table();

        var tableProps = new TableProperties(
            new TableBorders(
                new TopBorder { Val = BorderValues.Single, Size = 6, Color = "999999" },
                new BottomBorder { Val = BorderValues.Single, Size = 6, Color = "999999" },
                new LeftBorder { Val = BorderValues.Single, Size = 6, Color = "999999" },
                new RightBorder { Val = BorderValues.Single, Size = 6, Color = "999999" },
                new InsideHorizontalBorder { Val = BorderValues.Single, Size = 6, Color = "999999" },
                new InsideVerticalBorder { Val = BorderValues.Single, Size = 6, Color = "999999" }),
            new TableWidth { Type = TableWidthUnitValues.Pct, Width = "5000" });
        table.AppendChild(tableProps);

        var grid = new TableGrid();
        foreach (var width in ColumnWidths)
        {
            grid.AppendChild(new GridColumn { Width = width.ToString() });
        }
        table.AppendChild(grid);

        table.AppendChild(BuildRow(Headers, isHeader: true));

        foreach (var log in logs)
        {
            var cells = new[]
            {
                log.LessonDate.ToString("dd/MM/yyyy"),
                log.SkillFocus,
                string.IsNullOrWhiteSpace(log.Summary) ? "-" : log.Summary,
                string.IsNullOrWhiteSpace(log.NewVocabulary) ? "-" : log.NewVocabulary,
                string.IsNullOrWhiteSpace(log.GrammarNotes) ? "-" : log.GrammarNotes,
                string.IsNullOrWhiteSpace(log.OtherNotes) ? "-" : log.OtherNotes,
                string.IsNullOrWhiteSpace(log.Homework) ? "-" : log.Homework,
                $"{log.SelfRating}/5"
            };
            table.AppendChild(BuildRow(cells, isHeader: false));
        }

        return table;
    }

    private static TableRow BuildRow(string[] cellTexts, bool isHeader)
    {
        var row = new TableRow();

        for (int i = 0; i < cellTexts.Length; i++)
        {
            var cell = new TableCell();

            var cellProps = new TableCellProperties(
                new TableCellWidth { Type = TableWidthUnitValues.Dxa, Width = ColumnWidths[i].ToString() },
                new TableCellVerticalAlignment { Val = TableVerticalAlignmentValues.Center });

            if (isHeader)
            {
                cellProps.AppendChild(new Shading
                {
                    Val = ShadingPatternValues.Clear,
                    Color = "auto",
                    Fill = "4F46E5"
                });
            }

            cell.AppendChild(cellProps);

            var runProps = new RunProperties();
            if (isHeader)
            {
                runProps.Append(new Bold());
                runProps.Append(new Color { Val = "FFFFFF" });
            }
            runProps.Append(new FontSize { Val = "18" });

            // Giữ xuống dòng trong ô (mỗi dòng nhập trong textarea -> 1 dòng trong ô Word)
            var lines = cellTexts[i].Replace("\r\n", "\n").Split('\n');
            var paragraph = new Paragraph();
            for (int lineIdx = 0; lineIdx < lines.Length; lineIdx++)
            {
                var run = new Run(runProps.CloneNode(true), new Text(lines[lineIdx]) { Space = SpaceProcessingModeValues.Preserve });
                paragraph.AppendChild(run);
                if (lineIdx < lines.Length - 1)
                {
                    paragraph.AppendChild(new Run(new Break()));
                }
            }
            cell.AppendChild(paragraph);

            row.AppendChild(cell);
        }

        return row;
    }
}
