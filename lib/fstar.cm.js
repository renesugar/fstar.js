/* F* language definition for CodeMirror.

Forked off from CodeMirror.
Original copyright (c) by Marijn Haverbeke and others.
Modifications copyright (C) 2017-2018 Clément Pit-Claudel
URL: https://github.com/cpitclaudel/fstar.js

This file is also found in fslit.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. */

/* global CodeMirror define */

(function(mod) {
    if (typeof exports == "object" && typeof module == "object") // CommonJS
        mod(require("../../lib/codemirror"));
    else if (typeof define == "function" && define.amd) // AMD
        define(["../../lib/codemirror"], mod);
    else // Plain browser env
        mod(CodeMirror);
})(function(CodeMirror) {
    "use strict";

    function fstarMode(_config, _parserConfig) {
        var syntax = {
            "def": [
                "begin", "end", "in",

                "open", "module", "include", "let", "rec",
                "val", "and", "exception", "effect", "new_effect",
                "sub_effect", "new_effect_for_free", "kind", "type",

                "new", "abstract", "logic", "assume", "visible",
                "unfold", "irreducible", "inline_for_extraction", "noeq", "noextract",
                "private", "opaque", "total", "default", "reifiable", "reflectable"
            ],
            "keyword": [
                "of",
                "forall", "exists",
                "assert", "assert_norm", "assume",
                "fun", "function",
                "try", "match", "when", "with",
                "if", "then", "else",
                "ALL", "All", "DIV", "Div", "EXN", "Ex", "Exn", "GHOST", "GTot", "Ghost",
                "Lemma", "PURE", "Pure", "Tot", "ST", "STATE", "St",
                "Unsafe", "Stack", "Heap", "StackInline", "Inline"
            ],
            "builtin": [
                "requires", "ensures", "modifies", "decreases",
                "attributes", "effect_actions"
            ],
            "atom": [
                "False", "True"
            ]
        };

        var words = {};
        for (var kind in syntax) {
            syntax[kind].forEach(function(word) {
                words[word] = kind;
            });
        }

        function tokenBase(stream, state) {
            var ch = stream.next();

            if (ch === '"') {
                state.tokenize = tokenString;
                return state.tokenize(stream, state);
            }
            if (ch === '(') {
                if (stream.eat('*')) {
                    state.commentLevel++;
                    state.tokenize = tokenComment;
                    return state.tokenize(stream, state);
                }
            }
            if (ch === '~') {
                stream.eatWhile(/\w/);
                return 'variable-2';
            }
            if (ch === '`') {
                stream.eatWhile(/\w/);
                return 'quote';
            }
            if (ch === '/' && stream.eat('/')) {
                stream.skipToEnd();
                return 'comment';
            }
            if (/\d/.test(ch)) {
                stream.eatWhile(/[\d]/);
                if (stream.eat('.')) {
                    stream.eatWhile(/[\d]/);
                }
                return 'number';
            }
            if (/[+\-*&%=<>!?|]/.test(ch)) {
                return 'operator';
            }
            if (/[\w\xa1-\uffff]/.test(ch)) {
                stream.eatWhile(/[\w\xa1-\uffff]/);
                var cur = stream.current();
                if (words.hasOwnProperty(cur)) {
                    return words[cur];
                } else if (/^[A-Z]/.test(cur)) {
                    stream.eat(/[?]/);
                    return 'type';
                } else {
                    return 'variable';
                }
            }
            return null;
        }

        function tokenString(stream, state) {
            var next, end = false, escaped = false;
            while ((next = stream.next()) != null) {
                if (next === '"' && !escaped) {
                    end = true;
                    break;
                }
                escaped = !escaped && next === '\\';
            }
            if (end && !escaped) {
                state.tokenize = tokenBase;
            }
            return 'string';
        }

        function tokenComment(stream, state) {
            var prev, next;
            while(state.commentLevel > 0 && (next = stream.next()) != null) {
                if (prev === '(' && next === '*') state.commentLevel++;
                if (prev === '*' && next === ')') state.commentLevel--;
                prev = next;
            }
            if (state.commentLevel <= 0) {
                state.tokenize = tokenBase;
            }
            return 'comment';
        }

        return {
            startState: function() {return {tokenize: tokenBase, commentLevel: 0};},
            token: function(stream, state) {
                if (stream.eatSpace()) return null;
                return state.tokenize(stream, state);
            },

            blockCommentStart: "(*",
            blockCommentEnd: "*)",
            lineComment: "//"
        };
    }

    CodeMirror.defineMode('fstar', fstarMode);
    CodeMirror.registerHelper("wordChars", "fstar", /[\w_']/);
    CodeMirror.defineMIME('text/x-fstar', { name: "fstar" });
});
