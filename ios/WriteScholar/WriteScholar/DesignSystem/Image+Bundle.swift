//
//  Image+Bundle.swift
//  WriteScholar
//
//  Loads loose bundle resources (files in Resources/, NOT in the asset
//  catalog) by name. SwiftUI's `Image("name")` only reads the asset catalog,
//  so the onboarding screenshots (Resources/screenshot-*.png) render blank
//  with it — this loads them straight from the bundle instead.
//

import SwiftUI
import UIKit

extension Image {
    /// Loads `name.ext` from the app bundle's loose resources. Falls back to
    /// an SF Symbol so nothing ever renders as an empty white box.
    static func bundleResource(_ name: String, ext: String = "png") -> Image {
        if let path = Bundle.main.path(forResource: name, ofType: ext),
           let ui = UIImage(contentsOfFile: path) {
            return Image(uiImage: ui)
        }
        return Image(systemName: "photo")
    }
}
