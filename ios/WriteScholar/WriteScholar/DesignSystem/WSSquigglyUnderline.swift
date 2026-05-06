//
//  WSSquigglyUnderline.swift
//  WriteScholar
//
//  Hand-drawn squiggly underline that mirrors the web's `<svg><path d="M2 6 Q50 1 100 5 T198 4">`
//  accent under the brand word in the hero. Drawn with two cubic curves so
//  it has a subtle wave instead of a straight line.
//

import SwiftUI

struct WSSquigglyUnderline: View {
    var color: Color = WSColor.brandPrimary.opacity(0.85)
    var lineWidth: CGFloat = 3

    var body: some View {
        GeometryReader { geo in
            Path { p in
                let w = geo.size.width
                let h = geo.size.height
                p.move(to: CGPoint(x: 0, y: h * 0.85))
                p.addQuadCurve(
                    to: CGPoint(x: w * 0.5, y: h * 0.45),
                    control: CGPoint(x: w * 0.25, y: h * 0.05)
                )
                p.addQuadCurve(
                    to: CGPoint(x: w, y: h * 0.55),
                    control: CGPoint(x: w * 0.75, y: h * 0.95)
                )
            }
            .stroke(color, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round, lineJoin: .round))
        }
    }
}

#Preview {
    VStack {
        Text("WriteScholar does both.")
            .font(.title)
        WSSquigglyUnderline()
            .frame(height: 8)
            .padding(.horizontal, 4)
    }
    .padding()
}
