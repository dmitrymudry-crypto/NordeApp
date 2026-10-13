import SwiftUI
import WebKit
import UIKit

struct SharedDocument: Identifiable {
    let id = UUID()
    let url: URL
}

struct ContentView: View {
    @State private var document: SharedDocument?
    @State private var errorMessage: String?

    var body: some View {
        NordeWebView(document: $document, errorMessage: $errorMessage)
            .background(Color(red: 0.965, green: 0.965, blue: 0.949))
            .ignoresSafeArea(.container, edges: .bottom)
            .sheet(item: $document) { item in
                DocumentShareView(url: item.url)
                    .onDisappear { try? FileManager.default.removeItem(at: item.url) }
            }
            .alert("Norde", isPresented: Binding(
                get: { errorMessage != nil },
                set: { if !$0 { errorMessage = nil } }
            )) {
                Button("OK", role: .cancel) { errorMessage = nil }
            } message: {
                Text(errorMessage ?? "")
            }
    }
}

struct NordeWebView: UIViewRepresentable {
    @Binding var document: SharedDocument?
    @Binding var errorMessage: String?

    func makeCoordinator() -> Coordinator { Coordinator(parent: self) }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()
        config.userContentController.add(context.coordinator, name: "nordeDownload")
        let view = WKWebView(frame: .zero, configuration: config)
        view.navigationDelegate = context.coordinator
        view.isOpaque = false
        view.backgroundColor = UIColor(red: 0.965, green: 0.965, blue: 0.949, alpha: 1)
        view.scrollView.backgroundColor = view.backgroundColor
        view.scrollView.contentInsetAdjustmentBehavior = .never
        if let index = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "Web") {
            // Only the app's bundled Web directory is readable by this view.
            view.loadFileURL(index, allowingReadAccessTo: index.deletingLastPathComponent())
        } else {
            DispatchQueue.main.async { errorMessage = "Die App-Dateien fehlen. Bitte bauen Sie das vollständige Norde-Projekt erneut." }
        }
        return view
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {
        context.coordinator.parent = self
    }

    static func dismantleUIView(_ uiView: WKWebView, coordinator: Coordinator) {
        uiView.configuration.userContentController.removeScriptMessageHandler(forName: "nordeDownload")
        uiView.navigationDelegate = nil
    }

    final class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
        var parent: NordeWebView
        init(parent: NordeWebView) { self.parent = parent }

        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = navigationAction.request.url else { decisionHandler(.cancel); return }
            if url.scheme == "mailto" {
                UIApplication.shared.open(url)
                decisionHandler(.cancel)
            } else if url.isFileURL || url.scheme == "about" {
                decisionHandler(.allow)
            } else {
                // The offline demo has no remote server or external sign-in navigation.
                decisionHandler(.cancel)
            }
        }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard message.name == "nordeDownload", message.frameInfo.isMainFrame,
                  let body = message.body as? [String: String],
                  let encoded = body["data"], encoded.count <= 12_000_000,
                  let data = Data(base64Encoded: encoded),
                  data.starts(with: Data("%PDF-".utf8)) else {
                parent.errorMessage = "Das PDF konnte nicht geöffnet werden."
                return
            }
            let url = FileManager.default.temporaryDirectory
                .appendingPathComponent("Norde-\(UUID().uuidString).pdf")
            do {
                try data.write(to: url, options: [.atomic, .completeFileProtection])
                parent.document = SharedDocument(url: url)
            } catch {
                parent.errorMessage = "Das PDF konnte nicht gespeichert werden."
            }
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            parent.errorMessage = "Die App konnte nicht geladen werden. Bitte starten Sie sie erneut."
        }
    }
}

struct DocumentShareView: UIViewControllerRepresentable {
    let url: URL
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: [url], applicationActivities: nil)
    }
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
