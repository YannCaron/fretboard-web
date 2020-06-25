/*
    Copyright © Yann Caron 2018 All rights reserved.
*/

// license above

var Fretboard = Fretboard || {
    BOARD_MARGIN_X: 35,
    BOARD_MARGIN_Y: 15,
    STRING_SPACING: 25,
    NOTE_SPACING: 35,
    TEXT_MARGIN_X: 5,
    LEGEND_MARGIN_X: 25,
    LEGEND_MARGIN_Y: 25,
    FONT_SIZE: 10,
    LEGEND_FONT_SIZE: 12,
    NUT_NOTE_RADIUS: 5,
    NOTE_RADIUS: 7,

    TYPES: {
        DEFAULT: { color: 'black' },
        0: { color: 'red', name: 'Root' },
        3: { color: '#993300', name: 'Minor third' },
        4: { color: '#ff9900', name: 'Major third' },
        6: { color: 'blue', name: 'Tritone (blues note)' },
        7: { color: 'purple', name: 'Fifth' },
    },

    MARKS: new Set([3, 5, 7, 9, 12, 15, 17, 19, 21, 24]),
};

(function (Fretboard) {

    Fretboard.FONT = `${Fretboard.FONT_SIZE}pt Arial`;
    Fretboard.LEGEND_FONT = `${Fretboard.LEGEND_FONT_SIZE}pt Arial`;

    var count = 0;

    Fretboard.Note = function (id, name, white, octave) {
        this.id = id;
        this.name = name;
        this.interval = count;
        this.white = white;
        this.octave = octave;

        count++;
    };

    Fretboard.NOTES = {
        A: new Fretboard.Note("A", "A", true, 1),
        Bb: new Fretboard.Note("Bb", "A#", false, 1),
        B: new Fretboard.Note("B", "B", true, 1),
        C: new Fretboard.Note("C", "C", true, 0),
        Db: new Fretboard.Note("Db", "C#", false, 0),
        D: new Fretboard.Note("D", "D", true, 0),
        Eb: new Fretboard.Note("Eb", "D#", false, 0),
        E: new Fretboard.Note("E", "E", true, 0),
        F: new Fretboard.Note("F", "F", true, 0),
        Gb: new Fretboard.Note("Gb", "F#", false, 0),
        G: new Fretboard.Note("G", "G", true, 0),
        Ab: new Fretboard.Note("Ab", "G#", false, 0),
    };

    Fretboard.NOTES.valueOf = function (interval) {
        return Object.entries(Fretboard.NOTES)[interval][1];
    }

    Fretboard.intervalsToNotes = function (root, intervals) {
        var notes = new Set();
        var n = 0;
        notes.add(root);

        for (var interval of intervals) {
            n += interval;
            var i = (root.interval + n) % 12;
            var note = Fretboard.NOTES.valueOf(i);
            notes.add(note);
        }

        return notes;
    }

    Fretboard.notesToIntervals = function (root, notes) {
        var list = [];

        for (var note of notes) {
            var i = note.interval - root.interval;
            if (i < 0) i += 12;
            list.push(i);
        }

        list.sort((a, b) => a - b);

        var intervals = [];

        var last = 0;
        for (var i of list) {
            var interval = i - last;
            if (interval != 0) intervals.push(interval);
            last = i;
        }
        intervals.push(12 - last);

        return intervals;
    }

    Fretboard.arrayToTunning = function (noteNames) {
        var tunning = [];

        for (var noteName of noteNames) {
            var note = Fretboard.NOTES[noteName.charAt(0).trim()];
            var octave = parseInt(noteName.charAt(1));
            tunning.push({ note: note, octave: octave });
        }

        return tunning;
    }

    drawMark = function (ctx, frt, w, h) {
        ctx.beginPath();
        ctx.fillStyle = 'black';
        var x = Fretboard.BOARD_MARGIN_X + frt * Fretboard.NOTE_SPACING - (Fretboard.NOTE_SPACING / 2);
        var str = data.tunning.length - 1;
        //ctx.globalAlpha = 0.3;
        ctx.rect(x - w / 2, Fretboard.BOARD_MARGIN_Y + h, w, str * Fretboard.STRING_SPACING - h * 2);
        ctx.fill();
        ctx.closePath();
    }

    drawBoard = function (ctx, data) {
        // strings
        ctx.beginPath();
        ctx.globalAlpha = 1;
        ctx.lineWidth = 1;
        for (var str = data.tunning.length - 1; str >= 0; str--) {
            var y = Fretboard.BOARD_MARGIN_Y + str * Fretboard.STRING_SPACING;
            ctx.moveTo(Fretboard.BOARD_MARGIN_X, y);
            ctx.lineTo(Fretboard.BOARD_MARGIN_X + data.fretCount * Fretboard.NOTE_SPACING, y);
            ctx.stroke();
        }
        ctx.closePath();

        // fret
        for (var frt = 0; frt <= data.fretCount; frt++) {

            if (frt != data.fretCount) {
                ctx.beginPath();
                ctx.lineWidth = (frt == 0) ? 5 : 1;
                var x = Fretboard.BOARD_MARGIN_X + frt * Fretboard.NOTE_SPACING;
                if (frt == 0) x += 2;
                ctx.globalAlpha = (frt == 0) ? 1 : 0.3;
                var str = data.tunning.length - 1;
                ctx.moveTo(x, Fretboard.BOARD_MARGIN_Y);
                ctx.lineTo(x, Fretboard.BOARD_MARGIN_Y + str * Fretboard.STRING_SPACING);
                ctx.stroke();
                ctx.closePath();
            }

            // marks
            if (Fretboard.MARKS.has(frt)) {
                var [w, h] = (frt == 12 || frt == 24) ? [20, 10] : [10, 10];
                drawMark(ctx, frt, w, h);
            }

        }

        // tunning
        ctx.beginPath();
        ctx.globalAlpha = 1;
        ctx.lineWidth = 1;
        ctx.font = Fretboard.FONT;
        for (var str = data.tunning.length - 1; str >= 0; str--) {
            var y = Fretboard.BOARD_MARGIN_Y + str * Fretboard.STRING_SPACING;
            var text = data.tunning[data.tunning.length - str - 1].note.name;
            ctx.fillText(text, Fretboard.TEXT_MARGIN_X, y + Fretboard.FONT_SIZE / 2);
        }
        ctx.closePath();

    }

    drawNote = function (ctx, x, y, radius, type) {
        ctx.beginPath();
        ctx.globalAlpha = 1;
        ctx.lineWidth = 2;
        ctx.strokeStyle = type.color;
        ctx.fillStyle = 'white';

        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();

        if (type != Fretboard.TYPES.DEFAULT) {

            ctx.beginPath();
            ctx.globalAlpha = 0.25;
            ctx.fillStyle = type.color;

            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.closePath();
        }
    }

    Fretboard.drawLegend = function (ctx) {
        const TEXT_MY = Fretboard.LEGEND_MARGIN_X + (Fretboard.NOTE_RADIUS / 2);

        var y = 0;
        for (var t in Fretboard.TYPES) {
            var type = Fretboard.TYPES[t];
            if (type != Fretboard.TYPES.DEFAULT) {
                drawNote(ctx, 25, Fretboard.LEGEND_MARGIN_X + y, Fretboard.NOTE_RADIUS, type);

                ctx.beginPath();
                ctx.fillStyle = 'black';
                ctx.globalAlpha = 1;
                ctx.lineWidth = 1;

                ctx.font = Fretboard.LEGEND_FONT;
                ctx.fillText(' - ' + type.name, 35, TEXT_MY + y);
                ctx.closePath();

                y += 25;
            }
        }
    }

    Fretboard.drawScale = function (ctx, data) {
        drawBoard(ctx, data);
        for (var str = data.tunning.length - 1; str >= 0; str--) {
            var y = Fretboard.BOARD_MARGIN_Y + str * Fretboard.STRING_SPACING;
            var stringNote = data.tunning[data.tunning.length - str - 1].note;
            for (var frt = 0; frt <= data.fretCount; frt++) {
                var x = (frt == 0)
                    ? Fretboard.BOARD_MARGIN_X - Fretboard.NUT_NOTE_RADIUS
                    : Fretboard.BOARD_MARGIN_X + frt * Fretboard.NOTE_SPACING - Fretboard.NOTE_SPACING / 2;

                var r = (frt == 0) ? Fretboard.NUT_NOTE_RADIUS : Fretboard.NOTE_RADIUS;

                var i = (stringNote.interval + frt) % 12;
                var note = Fretboard.NOTES.valueOf(i);
                var t = (stringNote.interval + frt - data.root.interval) % 12;
                if (t < 0) t += 12;

                if (data.notes.has(note)) {
                    var type = Fretboard.TYPES[t];
                    if (!type) type = Fretboard.TYPES.DEFAULT;
                    drawNote(ctx, x, y, r, type);
                }
            }

        }
    }

})(Fretboard)
