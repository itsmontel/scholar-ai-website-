//
//  WSTextField.swift
//  WriteScholar
//
//  Branded text field used by Sign-In / Sign-Up. Renders an SF Symbol
//  prefix icon, animates the violet focus ring, and supports both
//  regular and secure entry.
//

import SwiftUI
import UIKit

struct WSTextField: View {
    let placeholder: String
    let icon: String
    @Binding var text: String
    var isSecure: Bool = false
    var contentType: UITextContentType?
    var keyboard: UIKeyboardType = .default

    @FocusState private var isFocused: Bool
    @State private var hide = true

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: icon)
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(isFocused ? WSColor.duoPurple : WSColor.foregroundMuted)
                .frame(width: 22)

            Group {
                if isSecure && hide {
                    SecureField(placeholder, text: $text)
                } else {
                    TextField(placeholder, text: $text)
                }
            }
            .textContentType(contentType)
            .keyboardType(keyboard)
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled()
            .wsBody(.medium)
            .foregroundStyle(WSColor.foreground)
            .focused($isFocused)

            if isSecure {
                Button {
                    hide.toggle()
                } label: {
                    Image(systemName: hide ? "eye" : "eye.slash")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(WSColor.foregroundMuted)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 14)
        .background(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(WSColor.backgroundElevated)
                .overlay(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .stroke(
                            isFocused ? WSColor.duoPurple.opacity(0.7) : WSColor.hairline,
                            lineWidth: isFocused ? 2 : 1
                        )
                )
                .shadow(
                    color: isFocused ? WSColor.duoPurple.opacity(0.2) : .clear,
                    radius: isFocused ? 12 : 0,
                    y: 3
                )
        )
        .animation(.easeInOut(duration: 0.18), value: isFocused)
    }
}

#Preview {
    VStack(spacing: 16) {
        WSTextField(placeholder: "Email", icon: "envelope", text: .constant("hi@example.com"))
        WSTextField(placeholder: "Password", icon: "lock", text: .constant(""), isSecure: true)
    }
    .padding()
    .background(WSColor.background)
}
