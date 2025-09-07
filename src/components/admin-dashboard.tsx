"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getEventById, getAllKeepsakesByEventId } from "@/actions/admin-data";
import { Keepsake, Event, SerializableEvent } from "@/lib/types";
import { Button } from "./ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import {
  Camera,
  Clapperboard,
  FileText,
  Home,
  Pin,
  PinOff,
  Trash2,
  Settings,
  List,
  PauseCircle,
  PlayCircle,
  GalleryHorizontal,
  Eye,
  EyeOff,
  SkipForward,
  SkipBack,
  RefreshCw,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Activity,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { deleteKeepsake, togglePinKeepsake, toggleHideKeepsake, deleteGalleryItem } from "@/actions/memories";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { MotionDiv } from "./motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import EventSettingsForm from "./event-settings-form";
import KeepsakeTypeSettings from "./keepsake-type-settings";
import LogsViewer from "./logs-viewer";
import { toggleEventPause, skipNext, skipPrev, restartAutoplay } from "@/actions/events";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "./ui/carousel";
import KeepsakeCard from "./memory-card";
import DownloadButton from "./download-button";
import DeleteButton from "./delete-button";



export default function AdminDashboard({ 
  event: initialEvent, 
  onLogout,
  onDirtyChange,
  onNavigationAttempt 
}: { 
  event: SerializableEvent; 
  onLogout: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  onNavigationAttempt?: (target: string) => void;
}) {
  const [event, setEvent] = useState(initialEvent);
  const [keepsakes, setKeepsakes] = useState<Keepsake[]>([]);
  const [selectedKeepsake, setSelectedKeepsake] = useState<Keepsake | null>(null);
  const [popupGalleryIndex, setPopupGalleryIndex] = useState(0);
  const { toast } = useToast();
  const [isSettingsDirty, setIsSettingsDirty] = useState(false);
  const [navigationTarget, setNavigationTarget] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("keepsakes");
  const router = useRouter();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const handleDirtyChange = useCallback((dirty: boolean) => {
    setIsSettingsDirty(dirty);
    onDirtyChange?.(dirty);
  }, [onDirtyChange]);

  const handleTabChange = (value: string) => {
    if (isSettingsDirty) {
      setNavigationTarget(value);
    } else {
      setActiveTab(value);
    }
  };
  
  const handleNavigation = (path: string) => {
    if (isSettingsDirty) {
      setNavigationTarget(path);
    } else {
      if (onNavigationAttempt) {
        onNavigationAttempt(path);
      } else {
        router.push(path);
      }
    }
  };

  const confirmNavigation = () => {
    if (navigationTarget) {
      if (navigationTarget === 'keepsakes' || navigationTarget === 'settings' || navigationTarget === 'logs') {
        setActiveTab(navigationTarget);
      } else {
        router.push(navigationTarget);
      }
      setIsSettingsDirty(false);
      setNavigationTarget(null);
    }
  };

  const cancelNavigation = () => {
    setNavigationTarget(null);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch keepsakes
        const keepsakesData = await getAllKeepsakesByEventId(event.id);
        setKeepsakes(keepsakesData);
        
        // Reset to first page if current page is out of bounds
        const newTotalPages = Math.ceil(keepsakesData.length / itemsPerPage);
        if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(1);
        }

        // Fetch event data
        const eventData = await getEventById(event.id);
        if (eventData) {
          setEvent({
            ...eventData,
            id: eventData.id,
            createdAt: eventData.createdAt?.toISOString() || null,
            restartAutoplay: eventData.restartAutoplay?.toISOString() || null,
          } as SerializableEvent);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [event.id, currentPage, itemsPerPage]);
  
  const handleTogglePin = async (keepsakeId: string, pinned: boolean) => {
    const result = await togglePinKeepsake(event.slug, keepsakeId, pinned);
    if (result.success) {
      toast({ title: `Keepsake ${pinned ? 'unpinned' : 'pinned'}.` });
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  const handleToggleHide = async (keepsakeId: string, hidden: boolean) => {
    const result = await toggleHideKeepsake(event.slug, keepsakeId, hidden);
    if (result.success) {
      toast({ title: `Keepsake ${hidden ? 'shown' : 'hidden'}.` });
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  const handleDelete = async (keepsakeId: string) => {
    const result = await deleteKeepsake(event.slug, keepsakeId);
    if (result.success) {
      toast({ title: "Keepsake deleted." });
      setSelectedKeepsake(null); // Close the popup on successful deletion
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  const handleDeleteGalleryItem = async (keepsakeId: string, itemIndex: number) => {
    const result = await deleteGalleryItem(event.slug, keepsakeId, itemIndex);
    if (result.success) {
      toast({ title: "Gallery item deleted." });
      // If this was the last item in the gallery, close the popup
      const keepsake = keepsakes.find(k => k.id === keepsakeId);
      if (keepsake && keepsake.fileUrls && keepsake.fileUrls.length <= 1) {
        setSelectedKeepsake(null);
      }
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  const handleKeepsakeSelect = (keepsake: Keepsake) => {
    setSelectedKeepsake(keepsake);
    setPopupGalleryIndex(0); // Reset gallery index when opening a keepsake
  };

  const handleTogglePause = async () => {
    await toggleEventPause(event.id, event.slug, !event.paused);
    toast({
      title: `Keepsake wall ${!event.paused ? 'resumed' : 'paused'}.`,
    });
  };

  const handleSkipNext = async () => {
    await skipNext(event.id, event.slug);
    toast({ title: "Skipped to next keepsake." });
  };
  
  const handleSkipPrev = async () => {
    await skipPrev(event.id, event.slug);
    toast({ title: "Returned to previous keepsake." });
  };

  const handleResetCarousel = async () => {
    await restartAutoplay(event.id, event.slug);
    toast({ title: "Carousel reset command sent." });
  };

  const getIcon = (keepsake: Keepsake) => {
    if (keepsake.type === "gallery" || (keepsake.type === 'photo' && keepsake.fileUrls && keepsake.fileUrls.length > 1)) {
      return <GalleryHorizontal className="h-5 w-5" />;
    }
    if (keepsake.type === "photo") return <Camera className="h-5 w-5" />;
    if (keepsake.type === "video") return <Clapperboard className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  // Pagination logic
  const totalPages = Math.ceil(keepsakes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentKeepsakes = keepsakes.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setItemsPerPage(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Generate page numbers with ellipsis for better UX
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 7;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);
      
      if (currentPage > 4) {
        pages.push('...');
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }
      
      if (currentPage < totalPages - 3) {
        pages.push('...');
      }
      
      // Show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <>
      <AlertDialog open={!!navigationTarget} onOpenChange={() => setNavigationTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>You have unsaved changes.</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave? Your changes will be discarded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelNavigation}>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={confirmNavigation}>Leave</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!selectedKeepsake} onOpenChange={() => setSelectedKeepsake(null)}>
        <DialogContent className="max-w-4xl w-[90vw] h-[90vh] flex flex-col p-4 sm:p-6 rounded-lg">
          {selectedKeepsake && (
            <>
              <DialogHeader className="flex-shrink-0 pr-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DialogTitle className="font-headline truncate mr-2">
                      Keepsake
                    </DialogTitle>
                    {selectedKeepsake.pinned && <Pin className="text-primary size-6" fill="currentColor"/>}
                  </div>
                  <div className="flex gap-2">
                    <DownloadButton 
                      keepsake={selectedKeepsake}
                      currentGalleryIndex={popupGalleryIndex}
                      allowDownloads={event.allowDownloads ?? false}
                      isAdmin={true}
                    />
                    <DeleteButton 
                      keepsake={selectedKeepsake}
                      currentGalleryIndex={popupGalleryIndex}
                      onDelete={handleDelete}
                      onDeleteGalleryItem={handleDeleteGalleryItem}
                    />
                  </div>
                </div>
              </DialogHeader>
              <DialogDescription className="text-sm">
                {selectedKeepsake.name && `By ${selectedKeepsake.name} | `}
                {selectedKeepsake.createdAt && typeof selectedKeepsake.createdAt !== 'string' && selectedKeepsake.createdAt?.toDate?.() && new Date(selectedKeepsake.createdAt.toDate()).toLocaleString()}
              </DialogDescription>
              <div className="flex-1 min-h-0 bg-muted/20 rounded-lg flex items-center justify-center relative overflow-hidden">
                <KeepsakeCard
                  keepsake={selectedKeepsake}
                  isModal={true}
                  isActive={true}
                  galleryTransitionDuration={event.galleryTransitionDuration || 200}
                  currentGalleryIndex={popupGalleryIndex}
                />
                
                {/* Gallery navigation controls for popup */}
                {selectedKeepsake.type === 'gallery' && selectedKeepsake.fileUrls && selectedKeepsake.fileUrls.length > 1 && (
                  <>
                    {/* Left/Right navigation arrows */}
                    <button
                      onClick={() => setPopupGalleryIndex((prev) => (prev - 1 + selectedKeepsake.fileUrls!.length) % selectedKeepsake.fileUrls!.length)}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/30 text-white rounded-full hover:bg-black/50 transition-colors z-10"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => setPopupGalleryIndex((prev) => (prev + 1) % selectedKeepsake.fileUrls!.length)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/30 text-white rounded-full hover:bg-black/50 transition-colors z-10"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {/* Bottom navigation dots */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
                      <div className="flex items-center gap-2 p-2 bg-black/30 rounded-full backdrop-blur-sm">
                        {selectedKeepsake.fileUrls.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setPopupGalleryIndex(index)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              index === popupGalleryIndex ? 'bg-white' : 'bg-white/30'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              {selectedKeepsake.caption && (
                <p className="p-4 bg-muted/50 rounded-md italic text-center flex-shrink-0 mt-2">"{selectedKeepsake.caption}"</p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <header className="mb-8">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-4xl font-headline">Keepsakes - {event.name}</h1>
            <p className="text-muted-foreground">Admin Dashboard</p>
          </div>
          
          <div className="bg-card rounded-lg border p-4 overflow-hidden">
            <h2 className="text-lg font-semibold mb-4">Wall Controls</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
              <Button onClick={handleSkipPrev} variant="outline" size="sm" className="h-10 min-w-0">
                <SkipBack className="mr-2 h-4 w-4 flex-shrink-0" /> 
                <span className="truncate">Prev</span>
              </Button>
              <Button onClick={handleSkipNext} variant="outline" size="sm" className="h-10 min-w-0">
                <SkipForward className="mr-2 h-4 w-4 flex-shrink-0" /> 
                <span className="truncate">Next</span>
              </Button>
              <Button onClick={handleTogglePause} variant={event.paused ? "default" : "outline"} size="sm" className="h-10 min-w-0">
                {event.paused ? (
                  <>
                    <PlayCircle className="mr-2 h-4 w-4 flex-shrink-0" /> 
                    <span className="truncate">Resume</span>
                  </>
                ) : (
                  <>
                    <PauseCircle className="mr-2 h-4 w-4 flex-shrink-0" /> 
                    <span className="truncate">Pause</span>
                  </>
                )}
              </Button>
              <Button onClick={handleResetCarousel} variant="outline" size="sm" className="h-10 min-w-0">
                <RefreshCw className="mr-2 h-4 w-4 flex-shrink-0" /> 
                <span className="truncate">Reset</span>
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full overflow-x-hidden">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="keepsakes"><List className="mr-2 h-4 w-4" />Keepsakes</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="mr-2 h-4 w-4" />Settings</TabsTrigger>
          <TabsTrigger value="logs"><Activity className="mr-2 h-4 w-4" />Logs</TabsTrigger>
        </TabsList>
        <TabsContent value="keepsakes" className="mt-4 w-full">
          <div className="bg-card rounded-lg border shadow-sm w-full overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentKeepsakes.map((keepsake) => (
                  <TableRow key={keepsake.id}>
                    <TableCell>{getIcon(keepsake)}</TableCell>
                    <TableCell>
                      <div 
                        className="cursor-pointer"
                        onClick={() => handleKeepsakeSelect(keepsake)}
                      >
                        {(keepsake.type === 'photo' || keepsake.type === 'gallery') && keepsake.fileUrls && (
                          <Image src={keepsake.fileUrls[0]} alt="keepsake" width={64} height={64} className="rounded-md object-cover h-16 w-16" />
                        )}
                        {keepsake.type === 'video' && <div className="h-16 w-16 bg-muted rounded-md flex items-center justify-center">Video</div>}
                        {keepsake.type === 'text' && <p className="truncate max-w-xs">{keepsake.text}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="truncate">{keepsake.name || "Anonymous"}</TableCell>
                    <TableCell>{keepsake.createdAt && keepsake.createdAt?.toDate?.() && new Date(keepsake.createdAt.toDate()).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {keepsake.pinned && <Badge>Pinned</Badge>}
                        {keepsake.hidden && <Badge variant="secondary">Hidden</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => handleKeepsakeSelect(keepsake)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <DownloadButton 
                          keepsake={keepsake}
                          currentGalleryIndex={0}
                          allowDownloads={event.allowDownloads ?? false}
                          isAdmin={true}
                        />
                        <Button variant="ghost" size="icon" onClick={() => handleTogglePin(keepsake.id, !!keepsake.pinned)}>
                          {keepsake.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleToggleHide(keepsake.id, !!keepsake.hidden)}>
                          {keepsake.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the keepsake from the wall.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(keepsake.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
            {keepsakes.length === 0 && (
              <div className="text-center p-8 text-muted-foreground">No keepsakes have been uploaded yet.</div>
            )}
            
            {/* Pagination Controls */}
            {keepsakes.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, keepsakes.length)} of {keepsakes.length} keepsakes
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Per page:</span>
                    <Select value={itemsPerPage.toString()} onValueChange={(value) => handlePageSizeChange(parseInt(value))}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {getPageNumbers().map((page, index) => (
                      <div key={index}>
                        {page === '...' ? (
                          <span className="px-2 text-muted-foreground">...</span>
                        ) : (
                          <Button
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page as number)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="settings" className="mt-4 space-y-6">
          <EventSettingsForm event={event} onDirtyChange={handleDirtyChange} />
          <KeepsakeTypeSettings event={event} onDirtyChange={handleDirtyChange} />
        </TabsContent>
        <TabsContent value="logs" className="mt-4">
          <LogsViewer event={event} />
        </TabsContent>
      </Tabs>
    </>
  );
}
