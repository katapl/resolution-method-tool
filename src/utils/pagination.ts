
export const getPaginationRange = (currentStep: number, totalSteps: number) => {
    const siblingCount = 1;

    const totalPageNumbers = siblingCount + 5;

    if (totalPageNumbers >= totalSteps) {
        return Array.from({ length: totalSteps }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentStep - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentStep + siblingCount, totalSteps);

    const showLeftDots = leftSiblingIndex > 2;
    const showRightDots = rightSiblingIndex < totalSteps - 2;

    const firstPageIndex = 1;
    const lastPageIndex = totalSteps;

    if (!showLeftDots && showRightDots) {
        let leftItemCount = 3 + 2 * siblingCount;
        let leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
        return [...leftRange, '...', totalSteps];
    }

    if (showLeftDots && !showRightDots) {
        let rightItemCount = 3 + 2 * siblingCount;
        let rightRange = Array.from({ length: rightItemCount }, (_, i) => totalSteps - rightItemCount + i + 1);
        return [firstPageIndex, '...', ...rightRange];
    }

    if (showLeftDots && showRightDots) {
        let middleRange = Array.from({ length: rightSiblingIndex - leftSiblingIndex + 1 }, (_, i) => leftSiblingIndex + i);
        return [firstPageIndex, '...', ...middleRange, '...', lastPageIndex];
    }

    return [];
};