import SwiftData
import SwiftUI

struct EditThoughtView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext
    let entry: ThoughtEntry

    @State private var editedBody: String
    @State private var saveError: Error?
    @FocusState private var isEditorFocused: Bool

    init(entry: ThoughtEntry) {
        self.entry = entry
        _editedBody = State(initialValue: entry.body)
    }

    private var trimmedBody: String {
        editedBody.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    var body: some View {
        NavigationStack {
            TextEditor(text: $editedBody)
                .focused($isEditorFocused)
                .font(.body)
                .lineSpacing(5)
                .padding(16)
                .scrollDismissesKeyboard(.interactively)
                .accessibilityLabel("思考の内容を編集")
                .navigationTitle("編集")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("キャンセル") {
                            dismiss()
                        }
                    }
                    ToolbarItem(placement: .confirmationAction) {
                        Button("保存", action: saveChanges)
                            .disabled(trimmedBody.isEmpty)
                    }
                    ToolbarItemGroup(placement: .keyboard) {
                        Spacer()
                        Button("完了") {
                            isEditorFocused = false
                        }
                    }
                }
        }
        .interactiveDismissDisabled(editedBody != entry.body)
        .onAppear {
            isEditorFocused = true
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

    private func saveChanges() {
        guard !trimmedBody.isEmpty else { return }

        let previousBody = entry.body
        let previousUpdatedAt = entry.updatedAt
        entry.body = trimmedBody
        entry.updatedAt = .now

        do {
            try modelContext.save()
            dismiss()
        } catch {
            entry.body = previousBody
            entry.updatedAt = previousUpdatedAt
            saveError = error
        }
    }
}
