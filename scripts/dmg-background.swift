import AppKit

let width: CGFloat = 660
let height: CGFloat = 400
let scale: CGFloat = 2
let appCenter = CGPoint(x: 180, y: 170)
let folderCenter = CGPoint(x: 480, y: 170)

let outputPath = CommandLine.arguments.count > 1
    ? CommandLine.arguments[1]
    : "src-tauri/dmg/background.png"

let rep = NSBitmapImageRep(
    bitmapDataPlanes: nil,
    pixelsWide: Int(width * scale),
    pixelsHigh: Int(height * scale),
    bitsPerSample: 8,
    samplesPerPixel: 4,
    hasAlpha: true,
    isPlanar: false,
    colorSpaceName: .deviceRGB,
    bytesPerRow: 0,
    bitsPerPixel: 0
)!
rep.size = NSSize(width: width, height: height)

NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
let ctx = NSGraphicsContext.current!.cgContext
ctx.translateBy(x: 0, y: height)
ctx.scaleBy(x: 1, y: -1)

let gradient = NSGradient(
    starting: NSColor(srgbRed: 0.98, green: 0.98, blue: 0.985, alpha: 1),
    ending: NSColor(srgbRed: 0.925, green: 0.93, blue: 0.94, alpha: 1)
)!
gradient.draw(in: NSRect(x: 0, y: 0, width: width, height: height), angle: 90)

func drawCentered(_ text: String, y: CGFloat, size: CGFloat, weight: NSFont.Weight, color: NSColor) {
    let paragraph = NSMutableParagraphStyle()
    paragraph.alignment = .center
    let attributes: [NSAttributedString.Key: Any] = [
        .font: NSFont.systemFont(ofSize: size, weight: weight),
        .foregroundColor: color,
        .paragraphStyle: paragraph,
    ]
    let string = NSAttributedString(string: text, attributes: attributes)
    let textHeight = string.size().height
    NSGraphicsContext.saveGraphicsState()
    let flip = NSAffineTransform()
    flip.translateX(by: 0, yBy: y + textHeight)
    flip.scaleX(by: 1, yBy: -1)
    flip.concat()
    string.draw(in: NSRect(x: 0, y: 0, width: width, height: textHeight))
    NSGraphicsContext.restoreGraphicsState()
}

let primary = NSColor(srgbRed: 0.11, green: 0.11, blue: 0.12, alpha: 1)
let secondary = NSColor(srgbRed: 0.42, green: 0.42, blue: 0.45, alpha: 1)
let accent = NSColor(srgbRed: 0.45, green: 0.45, blue: 0.45, alpha: 1)

drawCentered("Install AgentOne", y: 26, size: 22, weight: .semibold, color: primary)
drawCentered("Drag the AgentOne icon onto the Applications folder", y: 58, size: 13, weight: .regular, color: secondary)

let iconSize: CGFloat = 56
let iconScale = iconSize / 24
let iconOrigin = CGPoint(x: (appCenter.x + folderCenter.x) / 2 - iconSize / 2, y: appCenter.y - iconSize / 2)
func iconPoint(_ x: CGFloat, _ y: CGFloat) -> CGPoint {
    CGPoint(x: iconOrigin.x + x * iconScale, y: iconOrigin.y + y * iconScale)
}

let arrow = NSBezierPath()
arrow.move(to: iconPoint(5, 12))
arrow.line(to: iconPoint(19, 12))
arrow.move(to: iconPoint(13, 18))
arrow.line(to: iconPoint(19, 12))
arrow.move(to: iconPoint(13, 6))
arrow.line(to: iconPoint(19, 12))
arrow.lineWidth = 2 * iconScale
arrow.lineCapStyle = .round
arrow.lineJoinStyle = .round
accent.setStroke()
arrow.stroke()

drawCentered("Then open AgentOne from your Applications folder.", y: 300, size: 12, weight: .regular, color: secondary)

NSGraphicsContext.restoreGraphicsState()

let data = rep.representation(using: .png, properties: [:])!
try! data.write(to: URL(fileURLWithPath: outputPath))
