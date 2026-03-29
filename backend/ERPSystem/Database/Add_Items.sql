/*
  Add rows to [Items] without clashing with existing names.
  Change USE below to your database name (e.g. PurchaseDb, ERPSystemDb).
*/

USE [PurchaseDb];
GO

/* Add one or more items — edit the VALUES list as needed */
INSERT INTO [dbo].[Items] ([Name])
SELECT v.[Name]
FROM (VALUES
    (N'Pineapple'),
    (N'Watermelon'),
    (N'Papaya'),
    (N'Blueberry'),
    (N'Cherry')
) AS v([Name])
WHERE NOT EXISTS (
    SELECT 1
    FROM [dbo].[Items] AS i
    WHERE i.[Name] = v.[Name]
);
GO

/* Optional: see all items */
-- SELECT [Id], [Name] FROM [dbo].[Items] ORDER BY [Id];
GO
