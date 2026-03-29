IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260329065752_InitialCreate'
)
BEGIN
    CREATE TABLE [Audit_Logs] (
        [Id] int NOT NULL IDENTITY,
        [Entity] nvarchar(128) NOT NULL,
        [Action] nvarchar(32) NOT NULL,
        [OldValue] nvarchar(max) NULL,
        [NewValue] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Audit_Logs] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260329065752_InitialCreate'
)
BEGIN
    CREATE TABLE [Items] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(128) NOT NULL,
        CONSTRAINT [PK_Items] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260329065752_InitialCreate'
)
BEGIN
    CREATE TABLE [Locations] (
        [Id] int NOT NULL IDENTITY,
        [Code] nvarchar(32) NOT NULL,
        [Name] nvarchar(128) NOT NULL,
        CONSTRAINT [PK_Locations] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260329065752_InitialCreate'
)
BEGIN
    CREATE TABLE [PurchaseBills] (
        [Id] int NOT NULL IDENTITY,
        [BillNo] nvarchar(64) NOT NULL,
        [BillDate] datetime2 NOT NULL,
        [ClientSyncId] nvarchar(128) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_PurchaseBills] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260329065752_InitialCreate'
)
BEGIN
    CREATE TABLE [PurchaseBillLines] (
        [Id] int NOT NULL IDENTITY,
        [PurchaseBillId] int NOT NULL,
        [ItemId] int NOT NULL,
        [LocationId] int NOT NULL,
        [Cost] decimal(18,4) NOT NULL,
        [Price] decimal(18,4) NOT NULL,
        [Quantity] int NOT NULL,
        [DiscountPercent] decimal(9,4) NOT NULL,
        [LineOrder] int NOT NULL,
        CONSTRAINT [PK_PurchaseBillLines] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PurchaseBillLines_Items_ItemId] FOREIGN KEY ([ItemId]) REFERENCES [Items] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_PurchaseBillLines_Locations_LocationId] FOREIGN KEY ([LocationId]) REFERENCES [Locations] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_PurchaseBillLines_PurchaseBills_PurchaseBillId] FOREIGN KEY ([PurchaseBillId]) REFERENCES [PurchaseBills] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260329065752_InitialCreate'
)
BEGIN
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'Name') AND [object_id] = OBJECT_ID(N'[Items]'))
        SET IDENTITY_INSERT [Items] ON;
    EXEC(N'INSERT INTO [Items] ([Id], [Name])
    VALUES (1, N''Mango''),
    (2, N''Apple''),
    (3, N''Banana''),
    (4, N''Orange''),
    (5, N''Grapes''),
    (6, N''Kiwi''),
    (7, N''Strawberry'')');
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'Name') AND [object_id] = OBJECT_ID(N'[Items]'))
        SET IDENTITY_INSERT [Items] OFF;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260329065752_InitialCreate'
)
BEGIN
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'Code', N'Name') AND [object_id] = OBJECT_ID(N'[Locations]'))
        SET IDENTITY_INSERT [Locations] ON;
    EXEC(N'INSERT INTO [Locations] ([Id], [Code], [Name])
    VALUES (1, N''LOC001'', N''Warehouse A''),
    (2, N''LOC002'', N''Warehouse B''),
    (3, N''LOC003'', N''Main Store'')');
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'Code', N'Name') AND [object_id] = OBJECT_ID(N'[Locations]'))
        SET IDENTITY_INSERT [Locations] OFF;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260329065752_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Locations_Code] ON [Locations] ([Code]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260329065752_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_PurchaseBillLines_ItemId] ON [PurchaseBillLines] ([ItemId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260329065752_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_PurchaseBillLines_LocationId] ON [PurchaseBillLines] ([LocationId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260329065752_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_PurchaseBillLines_PurchaseBillId] ON [PurchaseBillLines] ([PurchaseBillId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260329065752_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_PurchaseBills_BillNo] ON [PurchaseBills] ([BillNo]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260329065752_InitialCreate'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_PurchaseBills_ClientSyncId] ON [PurchaseBills] ([ClientSyncId]) WHERE [ClientSyncId] IS NOT NULL');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260329065752_InitialCreate'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260329065752_InitialCreate', N'8.0.11');
END;
GO

COMMIT;
GO

