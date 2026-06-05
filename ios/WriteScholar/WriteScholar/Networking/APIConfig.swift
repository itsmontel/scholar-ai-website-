//
//  APIConfig.swift
//  WriteScholar
//
//  API base URL. Defaults to the deployed Railway backend (the same host the
//  web app uses via VITE_API_URL), so the app works without running a local
//  server. For local backend development, set the WS_API_URL key in
//  Info.plist (e.g. http://localhost:3001/api, or your Mac's LAN IP when
//  running on a physical device).
//

import Foundation

enum APIConfig {
    /// Production backend on Railway — matches the web app's VITE_API_URL.
    private static let railwayBaseURL = "https://lucky-luck-production-4e5c.up.railway.app/api"

    /// Base URL for all API calls. An optional WS_API_URL value in Info.plist
    /// overrides this — handy for pointing at a local/LAN backend in dev.
    static let baseURL: URL = {
        if let override = Bundle.main.object(forInfoDictionaryKey: "WS_API_URL") as? String,
           !override.isEmpty,
           let url = URL(string: override) {
            return url
        }
        return URL(string: railwayBaseURL)!
    }()
}
