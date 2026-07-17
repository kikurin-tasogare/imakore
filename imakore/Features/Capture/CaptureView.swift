import Foundation
import SwiftData
import SwiftUI

struct CaptureView: View {
    @Environment(\.modelContext) private var modelContext
    @State private var draft = ""
    @State private var didSave = false
    @State private var feedbackToken = UUID()
    @State private var saveError: Error?
    @FocusState private var isEditorFocused: Bool

    private var trimmedDraft: String {
        draft.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                Text("今、何が頭にある？")
                    .font(.largeTitle.bold())
                    .accessibilityAddTraits(.isHeader)

                ZStack(alignment: .topLeading) {
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .fill(Color(.secondarySystemBackground))

                    if draft.isEmpty {
                        Text("思いついたことを、そのまま書いてみる")
                            .foregroundStyle(.secondary)
                            .padding(.horizontal, 17)
                            .padding(.vertical, 18)
                            .allowsHitTesting(false)
                    }

                    TextEditor(text: $draft)
                        .focused($isEditorFocused)
                        .font(.body)
                        .lineSpacing(4)
                        .scrollContentBackground(.hidden)
                        .padding(10)
                        .frame(minHeight: 220)
                        .accessibilityLabel("今、頭にあること")
                        .accessibilityHint("思いついたことやモヤモヤを自由に入力します")
                }

                Button(action: saveThought) {
                    Text("残す")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 6)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
                .disabled(trimmedDraft.isEmpty)
                .accessibilityHint(trimmedDraft.isEmpty ? "入力すると保存できます" : "入力した内容と現在の日時を保存します")

                if didSave {
                    Label("残しました", systemImage: "checkmark.circle.fill")
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity)
                        .transition(.opacity.combined(with: .move(edge: .bottom)))
                        .accessibilityAddTraits(.isStaticText)
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 24)
            .padding(.bottom, 40)
        }
        .scrollDismissesKeyboard(.interactively)
        .navigationTitle("残す")
        .navigationBarTitleDisplayMode(.inline)
        .sensoryFeedback(.success, trigger: feedbackToken)
        .toolbar {
            ToolbarItemGroup(placement: .keyboard) {
                Spacer()
                Button("完了") {
                    isEditorFocused = false
                }
            }
        }
        .alert("保存できませんでした", isPresented: Binding(
            get: { saveError != nil },
            set: { if !$0 { saveError = nil } }
        )) {
            Button("閉じる", role: .cancel) {}
        } message: {
            Text("少し時間をおいて、もう一度お試しください。")
        }
    }

    private func saveThought() {
        guard !trimmedDraft.isEmpty else { return }

        let entry = ThoughtEntry(body: trimmedDraft)
        modelContext.insert(entry)

        do {
            try modelContext.save()
            draft = ""
            feedbackToken = UUID()
            withAnimation(.easeOut(duration: 0.2)) {
                didSave = true
            }

            let currentFeedbackToken = feedbackToken
            Task {
                try? await Task.sleep(for: .seconds(1.8))
                guard feedbackToken == currentFeedbackToken else { return }
                withAnimation(.easeIn(duration: 0.2)) {
                    didSave = false
                }
            }
        } catch {
            modelContext.rollback()
            saveError = error
        }
    }
}

#Preview {
    NavigationStack {
        CaptureView()
    }
    .modelContainer(for: ThoughtEntry.self, inMemory: true)
}
