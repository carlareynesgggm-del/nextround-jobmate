# NextRound Career Hub — Guidelines

## Components

The design system exports these components — import them from `@ws-d05cea16d590d212b9c4/97ba193c-e6d8-47b5-9b04-2fe9348f6091` and compose them before building anything from scratch:

`ActivityFeed`, `AddApplicationFlow`, `AiAssistantButton`, `AiAssistant`, `AiDemo`, `AlertsBell`, `AppShell`, `ApplicationDialog`, `ApplicationHeader`, `ApplicationInfoTab`, `AppliedForm`, `AppsFilters`, `AppsKanban`, `AppsTable`, `AttentionCard`, `ButtonGroupSeparator`, `ButtonGroupText`, `ButtonGroup`, `Button`, `Checkbox`, `ChoiceCard`, `CompanyMark`, `Constants`, `ContactsTab`, `DetailsStep`, `DialogClose`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogOverlay`, `DialogPortal`, `DialogTitle`, `DialogTrigger`, `Dialog`, `DocumentsTab`, `DropdownMenuCheckboxItem`, `DropdownMenuContent`, `DropdownMenuGroup`, `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuPortal`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, `DropdownMenuSeparator`, `DropdownMenuShortcut`, `DropdownMenuSubContent`, `DropdownMenuSubTrigger`, `DropdownMenuSub`, `DropdownMenuTrigger`, `DropdownMenu`, `EmailConnectionCard`, `EmptyState`, `EntryStep`, `InputGroupAddon`, `InputGroupButton`, `InputGroupInput`, `InputGroupText`, `InputGroupTextarea`, `InputGroup`, `Input`, `JobDescriptionTab`, `JobTab`, `KpiCard`, `Label`, `LanguageProvider`, `LanguageSwitcher`, `NextBestActionCard`, `OutcomeQuestion`, `OverviewTab`, `PageHeader`, `Pill`, `PopoverAnchor`, `PopoverContent`, `PopoverTrigger`, `Popover`, `ProcessTab`, `ProductPreview`, `SavedForm`, `ScrollArea`, `ScrollBar`, `SectionCard`, `SelectContent`, `SelectGroup`, `SelectItem`, `SelectLabel`, `SelectScrollDownButton`, `SelectScrollUpButton`, `SelectSeparator`, `SelectTrigger`, `SelectValue`, `Select`, `Separator`, `SessionProvider`, `StageBadge`, `StepProgress`, `Switch`, `Textarea`, `TooltipContent`, `TooltipProvider`, `TooltipTrigger`, `Tooltip`, `UpdatesPanel`

Per-component details (import stanzas, props, variants, examples) live in `.lovable/rules/libraries/{slug}/components.md` — on disk, not auto-loaded. Read that file or the component source when the name alone isn't enough.

## Theme Files

The design system's theme is delivered through the following files. The author's original source files carry the full wiring the design system needs — variable declarations, framework-specific directives, provider objects, etc. — and are the canonical import target.

- `@ws-d05cea16d590d212b9c4/97ba193c-e6d8-47b5-9b04-2fe9348f6091/styles.css` (source — preferred import)
- `@ws-d05cea16d590d212b9c4/97ba193c-e6d8-47b5-9b04-2fe9348f6091/dist/tokens.css` (auto-generated flat list of CSS custom properties — a raw-values fallback only; does NOT carry framework-specific wiring that the source files above provide)

