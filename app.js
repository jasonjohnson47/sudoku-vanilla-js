(function() {
	
    'use strict';

    // generate empty grid
    var emptyGrid = [];

    for (let step = 0; step < 9; step++) {
        emptyGrid.push([]);
    }
    emptyGrid.forEach(function(row) {
        for (let step = 0; step < 9; step++) {
            row.push([]);
        }
    });
    
    if (!localStorage.sudokuGrid) {
        localStorage.sudokuGrid = JSON.stringify(emptyGrid);
    }
    
    // Model

	var model = {
        grid: JSON.parse(localStorage.sudokuGrid),
        updateLocalStorage: function() {
            localStorage.sudokuGrid = JSON.stringify(this.grid);
        }
    };

    // Controller

    var controller = {
        init: function() {
            view.init();
        },
        getGrid: function() {
            return model.grid;
        },
        updateCell: function(row, column, value) {
            model.grid[row][column] = value;
            model.updateLocalStorage();
            view.render();
        }
    };

    // View

    var view = {
        init: function() {
            this.gridElem = document.getElementById('grid');
            this.solveButton = document.getElementById('solve-btn');
            this.crosshatchingButton = document.getElementById('crosshatching-btn');
            this.reduceButton = document.getElementById('reduce-btn');
            this.nakedsButton = document.getElementById('nakeds-btn');
            this.xWingsButton = document.getElementById('xwings-btn');
            this.verifyButton = document.getElementById('verify-btn');
            this.clearButton = document.getElementById('clear-btn');
            this.createButton = document.getElementById('create-btn');

            this.gridElem.addEventListener('keyup', function(e) {
                var thisCellInput = e.target;
                var thisCell = thisCellInput.parentNode;
                if (isNaN(thisCellInput.value) || thisCellInput.value.trim() === '') {
                    controller.updateCell(thisCell.dataset.row, thisCell.dataset.column, []);
                } else {
                    controller.updateCell(thisCell.dataset.row, thisCell.dataset.column, parseFloat(thisCellInput.value));
                }
            }, false);

            this.solveButton.addEventListener('click', function() {
                solveGrid();
            }, false);

            this.crosshatchingButton.addEventListener('click', function() {
                solveNonets();
            }, false);

            this.reduceButton.addEventListener('click', function() {
                initReduceCandidates();
            }, false);

            this.nakedsButton.addEventListener('click', function() {
                removeNakeds();
            }, false);

            this.xWingsButton.addEventListener('click', function() {
                reduceCandidatesXWing();
            }, false);

            this.verifyButton.addEventListener('click', function() {
                verifyCompletedGrid();
            }, false);

            this.clearButton.addEventListener('click', function() {
                clearGrid();
            }, false);

            this.createButton.addEventListener('click', function() {
                createGame();
                setCandidates();
            }, false);

            this.render();
        },
        render: function() {
            var gridElem = this.gridElem;
            var grid = controller.getGrid();

            gridElem.innerHTML = '';

            grid.forEach(function(row, i) {
            
                row.forEach(function(cell, j) {
                    var cellElem = document.createElement('div');
                    cellElem.id = 'r' + i + 'c' + j;
                    cellElem.dataset.row = i;
                    cellElem.dataset.column = j;
                    cellElem.classList.add('cell');
                    
                    var cellInput = document.createElement('input');
                    cellInput.type = 'text';
                    cellInput.maxLength = '1';
                    cellInput.pattern = '[1-9]';
                    cellElem.appendChild(cellInput);
                    gridElem.appendChild(cellElem);

                    if (isCellSolved(i, j)) {
                        cellInput.value = grid[i][j];
                    }

                    if (cellHasCandidates(i, j)) {
                        var cellCandidates = document.createElement('div');
                        cellCandidates.classList.add('candidates');
                        cellCandidates.textContent = grid[i][j].join(' ');
                        cellElem.appendChild(cellCandidates);
                    }
                    
                });
            });
        }
    };

    function generateNonet(topLeftCellRow, topLeftCellCol) {
        var grid = controller.getGrid();
        var nonet = [];

        for (let i = topLeftCellRow; i < topLeftCellRow + 3; i++) {
            for (let j = topLeftCellCol; j < topLeftCellCol + 3; j++) {
                nonet.push(grid[i][j]);
            }
        }

        return nonet;
    }

    function getCellValue(row, column) {
        var grid = controller.getGrid();
        return grid[row][column];
    }

    function getRowValues(row) {
        var grid = controller.getGrid();
        var rowValues = [];
        grid[row].forEach(function(value) {
            rowValues.push(value);
        });
        return rowValues;
    }

    function getColumnValues(column) {
        var grid = controller.getGrid();
        var columnValues = [];
        grid.forEach(function(row) {
            columnValues.push(row[column]);
        });
        return columnValues;
    }

    function getNonetValues(row, column) {

        // sqr1
        if (row <= 2 && column <= 2) {
            return generateNonet(0,0);
        }

        // sqr2
        if (row <= 2 && (column >= 3 && column <= 5)) {
            return generateNonet(0,3);
        }

        // sqr3
        if (row <= 2 && column >= 6) {
            return generateNonet(0,6);
        }

        // sqr4
        if ((row >= 3 && row <= 5) && column <= 2) {
            return generateNonet(3,0);
        }

        // sqr5
        if ((row >= 3 && row <= 5) && (column >= 3 && column <= 5)) {
            return generateNonet(3,3);
        }

        // sqr6
        if ((row >= 3 && row <= 5) && column >= 6) {
            return generateNonet(3,6);
        }

        // sqr7
        if (row >= 6 && column <= 2) {
            return generateNonet(6,0);
        }

        // sqr8
        if (row >= 6 && (column >= 3 && column <= 5)) {
            return generateNonet(6,3);
        }

        // sqr9
        if (row >= 6 && column >= 6) {
            return generateNonet(6,6);
        }
    }

    function getNonetRowsCols(rowOrCol) {
        var rowOrCol1,
            rowOrCol2,
            rowOrCol3;

        if (rowOrCol === 0 || rowOrCol === 3 || rowOrCol === 6) {
            rowOrCol1 = rowOrCol;
            rowOrCol2 = rowOrCol + 1;
            rowOrCol3 = rowOrCol + 2;
        }
        if (rowOrCol === 1 || rowOrCol === 4 || rowOrCol === 7) {
            rowOrCol1 = rowOrCol - 1;
            rowOrCol2 = rowOrCol;
            rowOrCol3 = rowOrCol + 1;
        }
        if (rowOrCol === 2 || rowOrCol === 5 || rowOrCol === 8) {
            rowOrCol1 = rowOrCol - 2;
            rowOrCol2 = rowOrCol - 1;
            rowOrCol3 = rowOrCol;
        }

        return [rowOrCol1, rowOrCol2, rowOrCol3];
    }

    function isCellSolved (row, column) {
        var grid = controller.getGrid();

        if (typeof grid[row][column] === 'number') {
            return true;
        }
    }

    function cellHasCandidates (row, column) {
        var grid = controller.getGrid();
        var value = grid[row][column];

        if (Array.isArray(value) && value.length > 1) {
            return true;
        }
    }

    function isCleanValue(value) {
        // check if the value is an empty array
        if (Array.isArray(value) && value.length === 0) {
            return true;
        } else {
            return false;
        }
    }

    function crosshatchNonet (row, column) {

        var nonetValues = getNonetValues(row, column);
        var candidates = [1,2,3,4,5,6,7,8,9].filter(function(value) {
            return !(nonetValues.includes(value));
        });
        var newCandidates = [];
        var nonetRows = getNonetRowsCols(row);
        var nonetColumns = getNonetRowsCols(column);

        candidates.forEach(function(candidate) {

            var temporaryNonetValues = nonetValues.map(function(value) {
                if (Array.isArray(value)) {
                    return "o";
                } else {
                    return value;
                }
            });

            temporaryNonetValues.forEach(function(value, index) {
                var nonetRowValues;
                var nonetColumnValues;

                if (index <= 2) {
                    nonetRowValues = getRowValues(nonetRows[0]);
                }
                if (index >=3 && index <=5) {
                    nonetRowValues = getRowValues(nonetRows[1]);
                }
                if (index >= 6) {
                    nonetRowValues = getRowValues(nonetRows[2]);
                }

                if (index === 0 || index === 3 || index === 6) {
                    nonetColumnValues = getColumnValues(nonetColumns[0]);
                }
                if (index === 1 || index === 4 || index === 7) {
                    nonetColumnValues = getColumnValues(nonetColumns[1]);
                }
                if (index === 2 || index === 5 || index === 8) {
                    nonetColumnValues = getColumnValues(nonetColumns[2]);
                }

                if (value === 'o') {
                    if (nonetRowValues.includes(candidate)) {
                        temporaryNonetValues[index] = 'x';
                    }
                    if (nonetColumnValues.includes(candidate)) {
                        temporaryNonetValues[index] = 'x';
                    }
                }

            });

            var emptyCount = 0;

            temporaryNonetValues.forEach(function(value) {
                if (value === 'o') {
                    emptyCount++;
                }
            });

            var gridCell = nonetValuesArrayIndexToGridCell(temporaryNonetValues.indexOf('o'), row, column);

            if (emptyCount === 1) {
                newCandidates.push([gridCell[0], gridCell[1], candidate]);
            }
            
        });

        if (newCandidates.length === 1) {
            var cellRow = newCandidates[0][0];
            var cellColumn = newCandidates[0][1];
            var cellValue = newCandidates[0][2];
            controller.updateCell(cellRow, cellColumn, cellValue);
        } 
        
        /*if (newCandidates.length > 1) {
            controller.updateCell(cellRow, cellColumn, getCandidates(cellRow, cellColumn));
        }*/

    }

    function nonetValuesArrayIndexToGridCell(nonetValuesIndex, nonetTopLeftSqRow, nonetTopLeftSqCol) {
        var gridCellRow = nonetTopLeftSqRow;
        var gridCellCol = nonetTopLeftSqCol;

        if (nonetValuesIndex === 1) {
            gridCellCol = nonetTopLeftSqCol + 1;
        }
        if (nonetValuesIndex === 2) {
            gridCellCol = nonetTopLeftSqCol + 2;
        }
        if (nonetValuesIndex === 3) {
            gridCellRow = nonetTopLeftSqRow + 1;
        }
        if (nonetValuesIndex === 4) {
            gridCellRow = nonetTopLeftSqRow + 1;
            gridCellCol = nonetTopLeftSqCol + 1;
        }
        if (nonetValuesIndex === 5) {
            gridCellRow = nonetTopLeftSqRow + 1;
            gridCellCol = nonetTopLeftSqCol + 2;
        }
        if (nonetValuesIndex === 6) {
            gridCellRow = nonetTopLeftSqRow + 2;
        }
        if (nonetValuesIndex === 7) {
            gridCellRow = nonetTopLeftSqRow + 2;
            gridCellCol = nonetTopLeftSqCol + 1;
        }
        if (nonetValuesIndex === 8) {
            gridCellRow = nonetTopLeftSqRow + 2;
            gridCellCol = nonetTopLeftSqCol + 2;
        }

        return [gridCellRow, gridCellCol];
    }

    function solveNonets() {
        for (let row = 0; row <= 6; row = row + 3) {
            for (let col = 0; col <= 6; col = col + 3) {
                crosshatchNonet(row, col);
            }
        }
        setCandidates();
    }

    function getCandidates(row, column) {

        var grid = controller.getGrid();

        var allValues = Array.from(new Set(getNonetValues(row, column).concat(getRowValues(row)).concat(getColumnValues(column)))).filter(function(value) {
            return typeof value === 'number' || (Array.isArray(value) && value.length !== 0);
        });

        var startingCandidates;

        if (isCleanValue(grid[row][column])) {
            startingCandidates = [1,2,3,4,5,6,7,8,9];
        } else {
            startingCandidates = grid[row][column];
        }
        
        var candidates = startingCandidates.filter(function(value) {
            return !(allValues.includes(value));
        });

        return candidates;

    }

    /*
    naked triple
    three cells in a block, row, or column having only the same three candidates, or their subset
    all other appearances of the same candidates can be eliminated if they are in the same block, row, or column
    [[6,8], [4,6], [4,8], ...cells w/candidates...]

    naked quad
    four cells in a block, row, or column having only the same four candidates, or their subset
    all other appearances of the same candidates can be eliminated if they are in the same block, row, or column
    [[2,8], [6,8], [2,6,8,9], [6,8,9], ...cells w/candidates...]

    */

    function findNakeds(quantity, unitValues) {

        var tempUnitValues = unitValues.slice(0);
        var cellsWithSameCandidates = 0;
        var result = [];

        function findNakedsStep(arrayOfValues) {

            var cellsWithCandidates = arrayOfValues.filter(function(value) {
                return Array.isArray(value);
            });
            var lastGoodValue = [];
            var cellsToExcludeCount = 0;
            cellsWithSameCandidates = 0;

            result = arrayOfValues.reduce(function(accumulator, currentValue, currentIndex) {

                if (Array.isArray(currentValue)) {

                    var combined = Array.from(new Set(accumulator.concat(currentValue)));

                    if (combined.length > quantity) {
                        cellsToExcludeCount++;
                        cellsWithSameCandidates = cellsWithCandidates.length - cellsToExcludeCount;
                        return lastGoodValue;
                    } else {
                        cellsWithSameCandidates = cellsWithCandidates.length - cellsToExcludeCount;
                        lastGoodValue = combined;
                        return combined;
                    }

                } else {
                    return accumulator;
                }

            }, []);

        }

        while (tempUnitValues.length > 0) {
            if (cellsWithSameCandidates === quantity && result.length === quantity) {
                return result;
            } else {
                findNakedsStep(tempUnitValues);
                tempUnitValues.shift();
            }
        }

    }

    function removeNakedsFromUnit(nakeds, unitValues, unitIndexes, unitType) {
        if (nakeds) {
            unitValues.forEach(function(cellValue, index) {
                if (Array.isArray(cellValue)) {
                    var differentCandidates = cellValue.filter(function(value) {
                        return !nakeds.includes(value);
                    });
                    if (differentCandidates.length !== 0) {
                        if (unitType === 'row') {
                            controller.updateCell(unitIndexes.row, index, differentCandidates);
                        }
                        if (unitType === 'column') {
                            controller.updateCell(index, unitIndexes.column, differentCandidates);
                        }
                        if (unitType === 'nonet') {
                            var gridCell = nonetValuesArrayIndexToGridCell(index, unitIndexes.row, unitIndexes.column);
                            controller.updateCell(gridCell[0], gridCell[1], differentCandidates);
                        }
                    }
                }
            });
        }
    }

    function removeNakeds() {

        var grid = controller.getGrid();

        grid.forEach(function(rowValues, rowIndex) {
            removeNakedsFromUnit(findNakeds(3, rowValues), rowValues, { 'row': rowIndex }, 'row');
            removeNakedsFromUnit(findNakeds(4, rowValues), rowValues, { 'row': rowIndex }, 'row');
        });

        grid[0].forEach(function(column, columnIndex) {
            var columnValues = getColumnValues(columnIndex);
            removeNakedsFromUnit(findNakeds(3, columnValues), columnValues, { 'column': columnIndex }, 'column');
            removeNakedsFromUnit(findNakeds(4, columnValues), columnValues, { 'column': columnIndex }, 'column');
        });

        for (let rowIndex = 0; rowIndex <= 6; rowIndex = rowIndex + 3) {
            for (let columnIndex = 0; columnIndex <= 6; columnIndex = columnIndex + 3) {
                var nonetValues = getNonetValues(rowIndex, columnIndex);
                removeNakedsFromUnit(findNakeds(3, nonetValues), nonetValues, { 'row': rowIndex,'column': columnIndex }, 'nonet');
                removeNakedsFromUnit(findNakeds(4, nonetValues), nonetValues, { 'row': rowIndex, 'column': columnIndex }, 'nonet');
            }
        }


        
    }

    /*
    x-wing
    Candidate appears twice in two different rows (or columns), and those appearances are both in the same column (or row). The candidate appears in four cells that form a square or rectangle. The candidate can only appear in two of the four cells. The two positions have to be diagonal opposites forming an X (hence the name). Safe to eliminate the candidate from other appearances in the cross axis. For example, if the candidate appears twice in two different rows, remove the candidate from the cells of the shared columns.
    */

    function findXWings() {

        var grid = controller.getGrid();
        var xWings = [];

        function examineUnit(unitValues, unitIndex, mainAxis) {

            var crossAxis;
            if (mainAxis === 'row') {
                crossAxis = 'column';
            } else {
                crossAxis = 'row';
            }

            var candidatesExamined = [];
            var unitResults = [];

            unitValues.forEach(function(cellValue, cellIndex) {
                if (Array.isArray(cellValue)) {
                    cellValue.forEach(function(candidateValue) {

                        var count = 0;
                        var candidatePositions = [];

                        unitValues.forEach(function(cellValueForComparison, cellIndexForComparison) {
                            if (Array.isArray(cellValueForComparison)) {
                                if (cellIndexForComparison > cellIndex) {
                                    if (!candidatesExamined.includes(candidateValue)) {

                                        //console.log('Is ' + candidateValue + ' from ' + crossAxis + ' ' + cellIndex + ' in ' + crossAxis + ' ' + cellIndexForComparison + '?', cellValueForComparison.includes(candidateValue));

                                        if (cellValueForComparison.includes(candidateValue)) {
                                            count++;

                                            if (mainAxis === 'row') {
                                                candidatePositions.push([unitIndex, cellIndex]);
                                                candidatePositions.push([unitIndex, cellIndexForComparison]);
                                            }
                                            if (mainAxis === 'column') {
                                                candidatePositions.push([cellIndex, unitIndex]);
                                                candidatePositions.push([cellIndexForComparison, unitIndex]);
                                            }

                                        }
                                    }
                                }
                            }
                        });
                        if (count === 1) {
                            unitResults.push({
                                'axis': mainAxis,
                                'positions': candidatePositions,
                                'value': candidateValue
                            });
                        }
                        candidatesExamined.push(candidateValue);
                    });
                }
            });

            unitResults.forEach(function(candidateCellPair) {
                // look for same candidate value in the same cross axis units (rows or columns)

                function findOtherCandidatePair(unit, unitIndex) {

                    var candidatePairUnitIndex;
                    var cellACrossAxisIndex;
                    var cellBCrossAxisIndex;
                    var cellAValue;
                    var cellBValue;

                    if (mainAxis === 'row') {
                        candidatePairUnitIndex = candidateCellPair.positions[0][0];
                        cellACrossAxisIndex = candidateCellPair.positions[0][1];
                        cellBCrossAxisIndex = candidateCellPair.positions[1][1];
                    }
                    if (mainAxis === 'column') {
                        candidatePairUnitIndex = candidateCellPair.positions[0][1];
                        cellACrossAxisIndex = candidateCellPair.positions[0][0];
                        cellBCrossAxisIndex = candidateCellPair.positions[1][0];
                    }

                    cellAValue = unit[cellACrossAxisIndex];
                    cellBValue = unit[cellBCrossAxisIndex];

                    var count = 0;
                    var newCandidatePositions = [];

                    if (unitIndex > candidatePairUnitIndex) {
                        if (Array.isArray(cellAValue) && Array.isArray(cellBValue)) {
                            if (cellAValue.includes(candidateCellPair.value) && cellBValue.includes(candidateCellPair.value)) {

                                unit.forEach(function(cellValue) {
                                    if (Array.isArray(cellValue)) {
                                        if (cellValue.includes(candidateCellPair.value)) {
                                            //console.log(candidateCellPair.value + ' at' ,mainAxis, unitIndex, crossAxis, cellACrossAxisIndex + ' & ' + cellBCrossAxisIndex);
                                            count++;
                                        }
                                    }
                                });

                                if (count === 2) {

                                    if (mainAxis === 'row') {
                                        newCandidatePositions.push([unitIndex, cellACrossAxisIndex]);
                                        newCandidatePositions.push([unitIndex, cellBCrossAxisIndex]);
                                    }
                                    if (mainAxis === 'column') {
                                        newCandidatePositions.push([cellACrossAxisIndex, unitIndex]);
                                        newCandidatePositions.push([cellBCrossAxisIndex, unitIndex]);
                                    }

                                    var fourPositionsOfCandidate = candidateCellPair.positions.concat(newCandidatePositions);

                                    xWings.push({
                                        'axis': candidateCellPair.axis,
                                        'positions': fourPositionsOfCandidate,
                                        'value': candidateCellPair.value
                                    });

                                }

                            }
                        }
                    }

                }

                if (mainAxis === 'row') {

                    grid.forEach(function(unit, unitIndex) {
                        findOtherCandidatePair(unit, unitIndex);
                    });

                }
                if (mainAxis === 'column') {

                    grid[0].forEach(function(unit, unitIndex) {
                        var unitValues = getColumnValues(unitIndex);
                        findOtherCandidatePair(unitValues, unitIndex);
                    });

                }

            });

        }

        function getColumnValues(column) {
            var columnValues = [];
            grid.forEach(function(row) {
                columnValues.push(row[column]);
            });
            return columnValues;
        }

        // Check rows
        grid.forEach(function(row, index) {
            examineUnit(row, index, 'row');
        });

        // Check columns
        grid[0].forEach(function(column, index) {
            examineUnit(getColumnValues(index), index, 'column');
        });

        return xWings;

    }

    function reduceCandidatesXWing() {

        var xWings = findXWings();

        xWings.forEach(function(xWing) {

            var xWingRows = xWing.positions.map(function(position) {
                return position[0];
            });
            xWingRows = xWingRows.filter(function(rowPosition, index) {
                return xWingRows.indexOf(rowPosition) === index;
            });

            var xWingColumns = xWing.positions.map(function(position) {
                return position[1];
            });
            xWingColumns = xWingColumns.filter(function(columnPosition, index) {
                return xWingColumns.indexOf(columnPosition) === index;
            });

            if (xWing.axis === 'column') {

                xWingRows.forEach(function(xWingRow) {
                    var rowValues = getRowValues(xWingRow);
                    rowValues.forEach(function(cellValue, index) {
                        if (!xWingColumns.includes(index)) {
                            if (Array.isArray(cellValue)) {
                                removeCandidateFromCell(xWingRow, index, xWing.value);
                            }
                        }
                    });
                });
                
            }

            if (xWing.axis === 'row') {

                xWingColumns.forEach(function(xWingColumn) {
                    var columnValues = getColumnValues(xWingColumn);
                    columnValues.forEach(function(cellValue, index) {
                        if (!xWingRows.includes(index)) {
                            if (Array.isArray(cellValue)) {
                                removeCandidateFromCell(index, xWingColumn, xWing.value);
                            }
                        }
                    });
                });
                
            }

        });

    }

    function removeCandidateFromCell(row, column, value) {
        var cellValue = getCellValue(row, column);

        if (Array.isArray(cellValue) && cellValue.includes(value)) {
            var cellValueResult = cellValue.filter(function(candidate) {
                return candidate !== value;
            });
            controller.updateCell(row, column, cellValueResult);
        }
    }

    function initReduceCandidates() {
        for (let row = 0; row <= 6; row = row + 3) {
            for (let col = 0; col <= 6; col = col + 3) {
                reduceCandidates(row, col, 'row');
                reduceCandidates(row, col, 'column');
            }
        }
    }

    function reduceCandidates(row, column, direction) {

        // row and column = the nonet's top left cell, for example 0,0 and 0,3 and 3,6, etc.
        // if direction = row, main axis = row, cross axis = column
        // if direction = column, main axis = column, cross axis = row

        // If a nonet has candidates that only exist in a row or column within the nonet, remove those candidates from other cells in the same row or column outside the nonet.
        // For example: [6, 8, 3, [1,2], [1,2], 9, 7, 4, 5] <- nonetValues; 1s and 2s in the same row
        // For example: [9, 6, [1,4,5], 7, 3, [1,4,5], [1,5], 2, 8] <- nonetValues; 4s in the same column

        var nonetValues = getNonetValues(row, column);

        var nonetMainAxisSet1 = nonetValues.filter(function(value, index) {
            if (direction === 'row') {
                return index <= 2;
            }
            if (direction === 'column') {
                return index === 0 || index === 3 || index === 6;
            }
        }).filter(function(value) {
            return Array.isArray(value);
        });

        var nonetMainAxisSet2 = nonetValues.filter(function(value, index) {
            if (direction === 'row') {
                return index >=3 && index <=5;
            }
            if (direction === 'column') {
                return index === 1 || index === 4 || index === 7;
            }
        }).filter(function(value) {
            return Array.isArray(value);
        });

        var nonetMainAxisSet3 = nonetValues.filter(function(value, index) {
            if (direction === 'row') {
                return index >= 6;
            }
            if (direction === 'column') {
                return index === 2 || index === 5 || index === 8;
            }
        }).filter(function(value) {
            return Array.isArray(value);
        });

        var nonetMainAxisSets = [nonetMainAxisSet1, nonetMainAxisSet2, nonetMainAxisSet3];
        var allCandidatesInCrossAxisSets = [];

        nonetMainAxisSets.forEach(function(nonetMainAxisSet) {
            if (nonetMainAxisSet.length === 0) {
                allCandidatesInCrossAxisSets.push([]);
            } else {
                var allCandidatesInMainAxisSet = nonetMainAxisSet.reduce(function(accumulator, current) {
                    return accumulator.concat(current);
                }, []);
                allCandidatesInMainAxisSet = Array.from(new Set(allCandidatesInMainAxisSet));
                allCandidatesInCrossAxisSets.push(allCandidatesInMainAxisSet);
            }
        });

        allCandidatesInCrossAxisSets.forEach(function(allCandidatesInMainAxisSet, index) {

            var otherMainAxisSet1;
            var otherMainAxisSet2;

            if (index === 0) {
                otherMainAxisSet1 = index + 1;
                otherMainAxisSet2 = index + 2;
            }
            if (index === 1) {
                otherMainAxisSet1 = index - 1;
                otherMainAxisSet2 = index + 1;
            }
            if (index === 2) {
                otherMainAxisSet1 = index - 2;
                otherMainAxisSet2 = index - 1;
            }

            var allCandidatesUniqueToMainAxisSet = allCandidatesInMainAxisSet.filter(function(value) {
                var otherNonetMainAxisSetsValues = nonetMainAxisSets[otherMainAxisSet1].concat(nonetMainAxisSets[otherMainAxisSet2]).reduce(function(accumulator, current) {
                    return accumulator.concat(current);
                }, []);
                return !otherNonetMainAxisSetsValues.includes(value);
            });

            var gridMainAxisSetIndex;
            var gridMainAxisSetValues;
            var indexesToInclude;

            if (direction === 'row') {
                gridMainAxisSetIndex = row + index;
                gridMainAxisSetValues = getRowValues(gridMainAxisSetIndex);

                if (column === 0) {
                    indexesToInclude = [3, 4, 5, 6, 7, 8];
                }
                if (column === 3) {
                    indexesToInclude = [0, 1, 2, 6, 7, 8];
                }
                if (column === 6) {
                    indexesToInclude = [0, 1, 2, 3, 4, 5];
                }
            }
            if (direction === 'column') {
                gridMainAxisSetIndex = column + index;
                gridMainAxisSetValues = getColumnValues(gridMainAxisSetIndex);

                if (row === 0) {
                    indexesToInclude = [3, 4, 5, 6, 7, 8];
                }
                if (row === 3) {
                    indexesToInclude = [0, 1, 2, 6, 7, 8];
                }
                if (row === 6) {
                    indexesToInclude = [0, 1, 2, 3, 4, 5];
                }
            }

            gridMainAxisSetValues.forEach(function(cellValue, gridCrossAxisSetIndex) {
                if (indexesToInclude.includes(gridCrossAxisSetIndex)) {
                    if (Array.isArray(cellValue) && cellValue.length > 1) {
                        var newCandidates = cellValue.filter(function(value) {
                            return !allCandidatesUniqueToMainAxisSet.includes(value);
                        });
                        if (direction === 'row') {
                            controller.updateCell(gridMainAxisSetIndex, gridCrossAxisSetIndex, newCandidates);
                        }
                        if (direction === 'column') {
                            controller.updateCell(gridCrossAxisSetIndex, gridMainAxisSetIndex, newCandidates);
                        }
                        
                    }
                }
            });

        });

    }

    function solveCell(row, column) {

        if (!(isCellSolved(row, column))) {

            var candidates = getCandidates(row, column);
            var newCandidates = [];

            // if a single candidate works, store that value
            if (Array.isArray(candidates) && candidates.length === 1) {    
                controller.updateCell(row, column, candidates[0]);
                return;
            }

            var rowArrayValues = getRowValues(row).filter(function(value, index) {
                return index !== column;
            }).filter(function(value) {
                return Array.isArray(value) && value.length !== 0;
            });

            var columnArrayValues = getColumnValues(column).filter(function(value, index) {
                return index !== row;
            }).filter(function(value) {
                return Array.isArray(value) && value.length !== 0;
            });

            if (rowArrayValues.length && Array.isArray(candidates)) {
                // if one of the candidates doesn't exist in any rowArrayValues,
                // add that value to newCandidates array
                candidates.forEach(function(candidate) {
                    
                    var candidateInSomeArray = rowArrayValues.some(function(arrayValue) {
                        return arrayValue.includes(candidate);
                    });

                    if (candidateInSomeArray) {
                        // do nothing, the candidate does exist as a candidate for another cell in the same row
                    } else {
                        newCandidates.push(candidate);
                    }
                    
                });
            }

            if (columnArrayValues.length && Array.isArray(candidates)) {
                // if one of the candidates doesn't exist in any columnArrayValues,
                // add that value to newCandidates array
                candidates.forEach(function(candidate) {
                    
                    var candidateInSomeArray = columnArrayValues.some(function(arrayValue) {
                        return arrayValue.includes(candidate);
                    });

                    if (candidateInSomeArray) {
                        // do nothing, the candidate does exist as a candidate for another cell in the same column
                    } else {
                        newCandidates.push(candidate);
                    }
                    
                });
            }

            newCandidates = Array.from(new Set(newCandidates));

            if (newCandidates.length === 1) {
                // if a single candidate works, store that value
                controller.updateCell(row, column, newCandidates[0]);
            }
            if (newCandidates.length > 1) {
                controller.updateCell(row, column, newCandidates);
            }
            
        } // end if

        

    }

    function setCandidates() {

        var grid = controller.getGrid();

        grid.forEach(function(row, i) {
            row.forEach(function(column, j) {
                if (!(isCellSolved(i, j))) {
                    controller.updateCell(i, j, getCandidates(i, j));
                }
            });
        });

    }

    /*function forEachCell(callback) {
        var grid = controller.getGrid();
        grid.forEach(function(row, rowIndex) {
            row.forEach(function(column, columnIndex) {
                callback(rowIndex, columnIndex);
            });
        });
    }
    forEachCell(solveCell);*/

    function solveGrid() {

        var grid = controller.getGrid();

        grid.forEach(function(row, i) {
            row.forEach(function(column, j) {
                if (!(isCellSolved(i, j))) {
                    solveCell(i, j);
                }
            });
        });

    }

    function verifyCompletedGrid() {
        var grid = controller.getGrid();
        var gridColumns = [];
        var gridNonets = [];

        // Check rows
        var allRowsIncludeAllValues = grid.every(function(row) {
            return row.every(function(value) {
                return [1,2,3,4,5,6,7,8,9].includes(value);
            });
        });

        // Check columns
        grid[0].forEach(function(column, index) {
            gridColumns.push(getColumnValues(index));
        });

        var allColumnsIncludeAllValues = gridColumns.every(function(column) {
            return column.every(function(value) {
                return [1,2,3,4,5,6,7,8,9].includes(value);
            });
        });

        // Check nonets
        for (let row = 0; row <= 6; row = row + 3) {
            for (let col = 0; col <= 6; col = col + 3) {
                gridNonets.push(getNonetValues(row, col));
            }
        }

        var allNonetsIncludeAllValues = gridNonets.every(function(nonet) {
            return nonet.every(function(value) {
                return [1,2,3,4,5,6,7,8,9].includes(value);
            });
        });

        if (allRowsIncludeAllValues && allColumnsIncludeAllValues && allNonetsIncludeAllValues) {
            console.log('Sudoku completed successfully!');
        }

    }

    function clearGrid() {

        var grid = controller.getGrid();

        grid.forEach(function(row, i) {
            row.forEach(function(column, j) {
                controller.updateCell(i, j, []);
            });
        });

    }

    function createGame() {
        
        // Easy
        //model.grid = [[[],[],[],[],[],3,1,[],4],[2,6,[],5,[],4,[],[],[]],[[],3,9,[],[],[],8,5,[]],[7,[],3,[],4,6,[],[],[]],[[],[],[],3,[],8,[],[],[]],[[],[],[],7,1,[],4,[],3],[[],4,2,[],[],[],7,3,[]],[[],[],[],4,[],5,[],1,9],[9,[],6,8,[],[],[],[],[]]];

        // Easy
        //model.grid = [[[],[],4,7,[],[],5,[],6],[[],[],1,[],[],4,[],[],2],[2,[],[],[],1,[],[],[],8],[1,[],9,[],7,3,[],[],[]],[[],6,[],1,[],5,[],2,[]],[[],[],[],6,9,[],7,[],1],[5,[],[],[],2,[],[],[],7],[7,[],[],3,[],[],2,[],[]],[9,[],2,[],[],7,8,[],[]]];

        // Medium
        //model.grid = [[3,[],[],[],6,[],[],[],[]],[[],1,4,[],[],[],9,[],7],[6,5,[],[],[],7,[],[],[]],[[],8,[],[],2,5,[],[],[]],[1,[],9,[],[],[],6,[],2],[[],[],[],6,9,[],[],8,[]],[[],[],[],4,[],[],[],7,6],[4,[],1,[],[],[],5,9,[]],[[],[],[],[],7,[],[],[],8]];

        // Medium
        //model.grid = [[[],[],[],[],1,[],[],6,9],[[],[],[],[],[],8,[],3,7],[[],[],[],[],[],[],8,[],[]],[4,[],[],3,2,1,9,[],[]],[[],[],7,[],9,[],5,[],[]],[[],[],2,7,5,6,[],[],3],[[],[],8,[],[],[],[],[],[]],[5,3,[],2,[],[],[],[],[]],[9,2,[],[],4,[],[],[],[]]];

        // Expert, Solved
        //model.grid = [[[],[],[],9,[],2,[],[],5],[[],[],[],[],[],5,1,3,[]],[[],[],9,[],[],[],[],2,[]],[[],5,3,[],[],[],[],[],6],[4,[],[],[],8,[],[],[],1],[9,[],[],[],[],[],4,7,[]],[[],6,[],[],[],[],7,[],[]],[[],9,1,4,[],[],[],[],[]],[8,[],[],5,[],7,[],[],[]]];

        // Expert, January 21, Solved
        //model.grid = [[[],[],[],9,[],2,[],[],5],[[],[],[],[],[],5,1,3,[]],[[],[],9,[],[],[],[],2,[]],[[],5,3,[],[],[],[],[],6],[4,[],[],[],8,[],[],[],1],[9,[],[],[],[],[],4,7,[]],[[],6,[],[],[],[],7,[],[]],[[],9,1,4,[],[],[],[],[]],[8,[],[],5,[],7,[],[],[]]];

        // Expert, January 24, Solved
        //model.grid = [[[],[],[],8,[],[],[],1,[]],[[],[],[],2,[],[],8,9,6],[[],[],[],[],6,[],[],[],2],[2,[],[],[],[],[],3,[],[]],[[],[],8,3,[],1,4,[],[]],[[],[],7,[],[],[],[],[],9],[6,[],[],[],7,[],[],[],[]],[9,7,2,[],[],3,[],[],[]],[[],3,[],[],[],4,[],[],[]]];

        // Expert, January 27, Solved
        //model.grid = [[[],9,1,[],[],[],[],[],5],[[],[],[],[],9,4,3,[],[]],[[],3,[],6,[],[],[],[],[]],[[],[],[],[],[],[],[],7,9],[2,[],[],1,[],7,[],[],6],[8,5,[],[],[],[],[],[],[]],[[],[],[],[],[],1,[],5,[]],[[],[],2,4,3,[],[],[],[]],[5,[],[],[],[],[],2,4,[]]];

        // Expert, January 30, **UNSOLVED**
        model.grid = [[[],[],[],[],[],1,[],[],[]],[[],6,[],[],[],[],4,[],[]],[[],9,[],5,3,[],[],[],8],[[],4,[],[],5,3,[],[],7],[[],8,[],[],[],[],[],5,[]],[7,[],[],1,2,[],[],6,[]],[8,[],[],[],1,6,[],2,[]],[[],[],5,[],[],[],[],9,[]],[[],[],[],8,[],[],[],[],[]]];

        // Expert, July 5, Solved
        //model.grid = [[[],[],[],[],[],7,3,[],[]],[[],7,[],[],8,[],5,[],9],[6,[],1,[],[],[],[],[],7],[[],[],5,[],[],6,[],9,[]],[[],[],[],[],4,[],[],[],[]],[[],6,[],5,[],[],2,[],[]],[2,[],[],[],[],[],9,[],1],[1,[],9,[],5,[],[],7,[]],[[],[],3,8,[],[],[],[],[]]];

        // Expert, July 8, Solved
        //model.grid = [[3,[],[],[],[],2,[],[],6],[[],[],[],[],[],[],[],[],[]],[[],[],[],6,4,[],7,3,5],[[],1,[],[],2,[],[],6,[]],[6,[],[],4,[],7,[],[],1],[[],9,[],[],3,[],[],2,[]],[5,2,3,[],6,1,[],[],[]],[[],[],[],[],[],[],[],[],[]],[7,[],[],5,[],[],[],[],2]];
        
        // 4 star difficulty rating; 5/28/2020; https://puzzles.usatoday.com/sudoku/
        //model.grid = [[7,[],[],1,4,[],[],[],9],[1,[],[],2,[],[],[],4,[]],[[],5,[],[],3,[],[],[],[]],[[],[],[],[],2,[],1,[],4],[[],[],6,[],7,[],8,[],[]],[5,[],1,[],9,[],[],[],[]],[[],[],[],[],5,[],[],6,[]],[[],3,[],[],[],4,[],[],7],[2,[],[],[],8,6,[],[],1]];

        // 5 star difficulty rating; 6/5/2020; https://puzzles.usatoday.com/sudoku/
        //model.grid = [[[],[],[],[],5,4,3,8,[]],[[],[],5,9,8,[],[],[],2],[[],8,[],[],3,[],[],[],[]],[5,[],[],6,[],[],[],7,[]],[3,[],4,[],7,[],2,[],9],[[],7,[],[],[],9,[],[],1],[[],[],[],[],1,[],[],2,[]],[7,[],[],[],9,3,6,[],[]],[[],5,1,7,6,[],[],[],[]]];

        //https://www.websudoku.com/images/example-steps.html
        //model.grid = [[[],[],[],[],[],[],6,8,[]],[[],[],[],[],7,3,[],[],9],[3,[],9,[],[],[],[],4,5],[4,9,[],[],[],[],[],[],[]],[8,[],3,[],5,[],9,[],2],[[],[],[],[],[],[],[],3,6],[9,6,[],[],[],[],3,[],8],[7,[],[],6,8,[],[],[],[]],[[],2,8,[],[],[],[],[],[]]];

        model.updateLocalStorage();
        view.render();
    }

    controller.init();

}());