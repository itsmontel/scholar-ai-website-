//
//  KeychainStore.swift
//  WriteScholar
//
//  Tiny Keychain wrapper that stores the JWT auth token. Single shared
//  instance — auth token reads/writes pass through here.
//

import Foundation
import Security

final class KeychainStore: @unchecked Sendable {
    static let shared = KeychainStore()

    private let service = "com.writescholar.app"
    private let authTokenAccount = "auth_token"

    private init() {}

    var authToken: String? {
        get { read(account: authTokenAccount) }
        set {
            if let v = newValue {
                write(value: v, account: authTokenAccount)
            } else {
                delete(account: authTokenAccount)
            }
        }
    }

    // MARK: Generic helpers

    @discardableResult
    private func write(value: String, account: String) -> Bool {
        let data = Data(value.utf8)
        let q: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
        SecItemDelete(q as CFDictionary)
        var add = q
        add[kSecValueData as String] = data
        add[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock
        return SecItemAdd(add as CFDictionary, nil) == errSecSuccess
    }

    private func read(account: String) -> String? {
        let q: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecMatchLimit as String: kSecMatchLimitOne,
            kSecReturnData as String: true
        ]
        var item: AnyObject?
        guard SecItemCopyMatching(q as CFDictionary, &item) == errSecSuccess,
              let data = item as? Data
        else { return nil }
        return String(data: data, encoding: .utf8)
    }

    @discardableResult
    private func delete(account: String) -> Bool {
        let q: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
        let status = SecItemDelete(q as CFDictionary)
        return status == errSecSuccess || status == errSecItemNotFound
    }
}
